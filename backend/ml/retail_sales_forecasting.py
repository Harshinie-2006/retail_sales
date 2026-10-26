"""
Retail Sales Forecasting and Promotion Impact Analysis
Dataset: dunnhumby "Breakfast at the Frat" (Excel workbook)

Run in Google Colab:
    !pip install xgboost lightgbm openpyxl
    Upload the Excel file, set DATA_PATH below, then run all cells / this script.

Outputs (written next to the script):
    model_comparison.csv, test_predictions.csv, feature_importance.csv,
    actual_vs_predicted.png, feature_importance.png, promo_lift.csv, elasticity.csv
"""
import warnings
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import xgboost as xgb

import sys
import os

warnings.filterwarnings("ignore")
SEED = 42
DATA_PATH = r"D:\Downloads\Assessment Datasets\Assessment Datasets\Assessment - 3 [Retail Sales Forecasting and Promotion Effectiveness]\dunnhumby - Breakfast at the Frat.xlsx"
if len(sys.argv) > 1 and os.path.exists(sys.argv[1]):
    DATA_PATH = sys.argv[1]

# ----------------------------------------------------------------------------
# 1. LOAD + MERGE
# ----------------------------------------------------------------------------
def find_sheet(sheets, key):
    for name in sheets:
        if key in name.lower():
            return sheets[name]
    raise KeyError(f"No sheet containing '{key}' in {list(sheets)}")

sheets = pd.read_excel(DATA_PATH, sheet_name=None, header=1)
tx = find_sheet(sheets, "transaction")
prod = find_sheet(sheets, "product")
store = find_sheet(sheets, "store")
for d in (tx, prod, store):
    d.columns = [str(c).strip().lower().replace(" ", "_") for c in d.columns]

# the store lookup may call its key store_id
if "store_id" in store.columns and "store_num" not in store.columns:
    store = store.rename(columns={"store_id": "store_num"})

tx["week_end_date"] = pd.to_datetime(tx["week_end_date"])
df = tx.merge(prod, on="upc", how="left").merge(store, on="store_num", how="left", suffixes=("", "_store"))
print("rows:", len(df), "| weeks:", df["week_end_date"].nunique(),
      "| stores:", df["store_num"].nunique(), "| products:", df["upc"].nunique())

# ----------------------------------------------------------------------------
# 2. CLEAN (conservative: no outlier removal, they are real retail behaviour)
# ----------------------------------------------------------------------------
df = df.drop_duplicates(subset=["store_num", "upc", "week_end_date"])
df = df[(df["units"] >= 0) & (df["price"] > 0) & (df["base_price"] > 0)]
df = df.sort_values(["store_num", "upc", "week_end_date"]).reset_index(drop=True)

# ----------------------------------------------------------------------------
# 3. FEATURES  (spend, visits, hhs are NOT used: they are same-week outcomes = leakage)
# ----------------------------------------------------------------------------
df["discount_pct"] = (df["base_price"] - df["price"]) / df["base_price"] * 100
df["log_price"] = np.log(df["price"])
df["week_of_year"] = df["week_end_date"].dt.isocalendar().week.astype(int)
df["month"] = df["week_end_date"].dt.month

g = df.groupby(["store_num", "upc"])["units"]
for k in (1, 2, 4, 13, 52):
    df[f"lag_{k}"] = g.shift(k)
df["roll_mean_4"] = g.transform(lambda s: s.shift(1).rolling(4, min_periods=1).mean())
df["roll_mean_13"] = g.transform(lambda s: s.shift(1).rolling(13, min_periods=1).mean())
df["roll_std_4"] = g.transform(lambda s: s.shift(1).rolling(4, min_periods=2).std())

# Outlier flags suggested by the dunnhumby guide (kept, not deleted; reported only)
df["units_per_visit"] = df["units"] / df["visits"].replace(0, np.nan)
df["visits_per_hh"] = df["visits"] / df["hhs"].replace(0, np.nan)
print("rows with units/visit > 10:", int((df["units_per_visit"] > 10).sum()),
      "| visits/hh > 5:", int((df["visits_per_hh"] > 5).sum()))

for c in ("category", "sub_category", "manufacturer", "seg_value_name",
          "address_state_prov_code", "msa_code"):
    if c in df.columns:
        df[c + "_code"] = df[c].astype("category").cat.codes
df["upc_code"] = df["upc"].astype("category").cat.codes

FEATURES = [c for c in [
    "price", "base_price", "discount_pct", "log_price", "feature", "display", "tpr_only",
    "week_of_year", "month", "lag_1", "lag_2", "lag_4", "lag_13", "lag_52",
    "roll_mean_4", "roll_mean_13", "roll_std_4",
    "category_code", "sub_category_code", "manufacturer_code", "upc_code", "store_num",
    "seg_value_name_code", "address_state_prov_code_code", "msa_code_code",
    "sales_area_size_num", "parking_space_qty",   # parking is mostly blank: fine for XGBoost
    # avg_weekly_baskets deliberately excluded: it is averaged over the whole period (includes test weeks)
] if c in df.columns]
TARGET = "units"

# ----------------------------------------------------------------------------
# 4. CHRONOLOGICAL SPLIT 70 / 15 / 15 BY WEEK
# ----------------------------------------------------------------------------
weeks = np.sort(df["week_end_date"].unique())
n = len(weeks)
val_start, test_start = weeks[int(n * 0.70)], weeks[int(n * 0.85)]
train = df[df["week_end_date"] < val_start]
val = df[(df["week_end_date"] >= val_start) & (df["week_end_date"] < test_start)]
test = df[df["week_end_date"] >= test_start]
print(f"train {len(train)} | val {len(val)} | test {len(test)}")

# ----------------------------------------------------------------------------
# 5. METRICS
# ----------------------------------------------------------------------------
def metrics(y, p):
    y, p = np.asarray(y, float), np.asarray(p, float)
    m = ~np.isnan(p)
    y, p = y[m], p[m]
    return {
        "MAE": mean_absolute_error(y, p),
        "RMSE": float(np.sqrt(mean_squared_error(y, p))),
        "WAPE_%": 100 * np.abs(y - p).sum() / y.sum(),
        "R2": r2_score(y, p),
        "n": int(m.sum()),
    }

results = {}
# baselines
results["Naive (last week)"] = {"val": metrics(val[TARGET], val["lag_1"]),
                                "test": metrics(test[TARGET], test["lag_1"])}
results["Seasonal naive (52w)"] = {"val": metrics(val[TARGET], val["lag_52"]),
                                   "test": metrics(test[TARGET], test["lag_52"])}

# ----------------------------------------------------------------------------
# 6. MODELS
# ----------------------------------------------------------------------------
Xtr, ytr = train[FEATURES], train[TARGET]
Xva, yva = val[FEATURES], val[TARGET]
Xte, yte = test[FEATURES], test[TARGET]
preds_test = {}

def fit_xgb(objective, label):
    model = xgb.XGBRegressor(
        objective=objective,
        n_estimators=1000, learning_rate=0.03, max_depth=5,
        min_child_weight=5, subsample=0.8, colsample_bytree=0.8,
        reg_lambda=5, eval_metric="mae", early_stopping_rounds=50,
        tree_method="hist", n_jobs=-1, random_state=SEED,
    )
    model.fit(Xtr, ytr, eval_set=[(Xva, yva)], verbose=100)
    results[label] = {"val": metrics(yva, model.predict(Xva)),
                      "test": metrics(yte, model.predict(Xte)),
                      "best_iteration": int(model.best_iteration)}
    preds_test[label] = model.predict(Xte)
    return model

xgb_sq = fit_xgb("reg:squarederror", "XGBoost (squared error)")
xgb_poi = fit_xgb("count:poisson", "XGBoost (Poisson)")      # units are non-negative counts

# Random Forest (needs no NaN; fill with -1; subsample train rows to keep it fast)
rf = RandomForestRegressor(n_estimators=150, max_depth=14, min_samples_leaf=5,
                           max_features=0.7, n_jobs=-1, random_state=SEED)
rf_idx = Xtr.sample(min(len(Xtr), 250_000), random_state=SEED).index
rf.fit(Xtr.loc[rf_idx].fillna(-1), ytr.loc[rf_idx])
results["Random Forest"] = {"val": metrics(yva, rf.predict(Xva.fillna(-1))),
                            "test": metrics(yte, rf.predict(Xte.fillna(-1)))}
preds_test["Random Forest"] = rf.predict(Xte.fillna(-1))

try:
    import lightgbm as lgb
    lg = lgb.LGBMRegressor(n_estimators=1000, learning_rate=0.03, num_leaves=31,
                           min_child_samples=20, subsample=0.8, subsample_freq=1,
                           colsample_bytree=0.8, reg_lambda=5, random_state=SEED, verbose=-1)
    lg.fit(Xtr, ytr, eval_set=[(Xva, yva)], eval_metric="mae",
           callbacks=[lgb.early_stopping(50, verbose=False)])
    results["LightGBM"] = {"val": metrics(yva, lg.predict(Xva)),
                           "test": metrics(yte, lg.predict(Xte))}
    preds_test["LightGBM"] = lg.predict(Xte)
except ImportError:
    print("lightgbm not installed, skipping")

# ----------------------------------------------------------------------------
# 7. COMPARE + SELECT BY VALIDATION MAE
# ----------------------------------------------------------------------------
rows = []
for name, r in results.items():
    rows.append({"model": name,
                 **{f"val_{k}": v for k, v in r["val"].items()},
                 **{f"test_{k}": v for k, v in r["test"].items()}})
comp = pd.DataFrame(rows).sort_values("val_MAE")
comp.to_csv("model_comparison.csv", index=False)
print("\n", comp.round(3).to_string(index=False))

learned = {k: v for k, v in results.items() if k in preds_test}
best = min(learned, key=lambda k: learned[k]["val"]["MAE"])
print("\nBest model by validation MAE:", best)

out = test[["store_num", "upc", "week_end_date", TARGET]].copy()
out["pred"] = preds_test[best]
out.to_csv("test_predictions.csv", index=False)

# ----------------------------------------------------------------------------
# 8. PLOTS
# ----------------------------------------------------------------------------
wk = out.groupby("week_end_date")[[TARGET, "pred"]].sum()
plt.figure(figsize=(10, 4))
plt.plot(wk.index, wk[TARGET], label="Actual")
plt.plot(wk.index, wk["pred"], label=f"Predicted ({best})")
plt.title("Total weekly units, test period"); plt.legend(); plt.tight_layout()
plt.savefig("actual_vs_predicted.png", dpi=150); plt.close()

imp = pd.Series(xgb_sq.feature_importances_, index=FEATURES).sort_values()
imp.to_csv("feature_importance.csv")
imp.plot.barh(figsize=(7, 7), title="XGBoost feature importance")
plt.tight_layout(); plt.savefig("feature_importance.png", dpi=150); plt.close()

# ----------------------------------------------------------------------------
# 9. BUSINESS ANALYSIS: promotion lift + log-log price elasticity
# ----------------------------------------------------------------------------
cat_col = "category" if "category" in df.columns else "upc"
lift = []
for flag in ("feature", "display", "tpr_only"):
    t = df.groupby([cat_col, flag])["units"].mean().unstack()
    if {0, 1} <= set(t.columns):
        t["lift_x"] = t[1] / t[0]
        t["promo"] = flag
        lift.append(t.reset_index())
pd.concat(lift).to_csv("promo_lift.csv", index=False)

# Guide questions: differences by store price tier and by state, plus units/visit under promotion
if "seg_value_name" in df.columns:
    df.groupby(["seg_value_name", "feature", "display"])["units"].mean().unstack([1, 2]) \
      .to_csv("promo_by_store_tier.csv")
if "address_state_prov_code" in df.columns:
    df.groupby(["address_state_prov_code", "category"])["units"].mean().unstack() \
      .to_csv("units_by_state_category.csv")
df.groupby([cat_col, "feature", "display"])["units_per_visit"].median().unstack([1, 2]) \
  .to_csv("units_per_visit_by_promo.csv")

# elasticity per category: regress log(units+1) on log(price) with product, store, week fixed effects
import statsmodels.formula.api as smf
el = []
for cat, d in df.groupby(cat_col):
    d = d.sample(min(len(d), 80_000), random_state=SEED)
    d["ly"] = np.log1p(d["units"])
    m = smf.ols("ly ~ log_price + feature + display + tpr_only + C(upc) + C(store_num) + C(week_of_year)",
                data=d).fit()
    el.append({"category": cat, "elasticity": m.params["log_price"],
               "std_err": m.bse["log_price"], "n": int(m.nobs)})
pd.DataFrame(el).to_csv("elasticity.csv", index=False)
print("\nElasticity (association, not proven causal):\n", pd.DataFrame(el).round(3))
