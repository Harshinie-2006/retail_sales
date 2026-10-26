import os
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from ..models import User
from ..schemas import ElasticityItem, ElasticitySimulateRequest, ElasticitySimulateResponse
from ..deps import get_current_user

router = APIRouter(prefix="/elasticity", tags=["Price Elasticity"])

DEFAULT_ELASTICITY_DATA = {
    "FROZEN PIZZA": {
        "category": "FROZEN PIZZA",
        "elasticity": -2.201,
        "std_err": 0.018,
        "n": 80000,
        "ci_lower": -2.236,
        "ci_upper": -2.166,
        "interpretation": "Highly Price-Elastic (Discretionary convenience meal; sharp volume substitution response)"
    },
    "COLD CEREAL": {
        "category": "COLD CEREAL",
        "elasticity": -1.626,
        "std_err": 0.020,
        "n": 80000,
        "ci_lower": -1.665,
        "ci_upper": -1.587,
        "interpretation": "Moderately Elastic (High brand competition and promo switching behaviour)"
    },
    "ORAL HYGIENE PRODUCTS": {
        "category": "ORAL HYGIENE PRODUCTS",
        "elasticity": -0.948,
        "std_err": 0.013,
        "n": 80000,
        "ci_lower": -0.973,
        "ci_upper": -0.923,
        "interpretation": "Unit-Elastic (Essential personal care staple with habitual brand loyalty)"
    },
    "BAG SNACKS": {
        "category": "BAG SNACKS",
        "elasticity": -0.542,
        "std_err": 0.018,
        "n": 80000,
        "ci_lower": -0.577,
        "ci_upper": -0.507,
        "interpretation": "Inelastic (Impulse indulgence item; low price sensitivity at shelf point)"
    }
}

INTERPRETATIONS = {
    "FROZEN PIZZA": "Highly Price-Elastic (Discretionary convenience meal; sharp volume substitution response)",
    "COLD CEREAL": "Moderately Elastic (High brand competition and promo switching behaviour)",
    "ORAL HYGIENE PRODUCTS": "Unit-Elastic (Essential personal care staple with habitual brand loyalty)",
    "BAG SNACKS": "Inelastic (Impulse indulgence item; low price sensitivity at shelf point)"
}

def get_elasticity_dict():
    csv_file = "elasticity.csv"
    if os.path.exists(csv_file):
        try:
            import pandas as pd
            df = pd.read_csv(csv_file)
            data = {}
            for _, r in df.iterrows():
                cat = str(r["category"]).upper().strip()
                el = float(r["elasticity"])
                se = float(r["std_err"])
                n = int(r["n"])
                data[cat] = {
                    "category": cat,
                    "elasticity": round(el, 3),
                    "std_err": round(se, 3),
                    "n": n,
                    "ci_lower": round(el - 1.96 * se, 3),
                    "ci_upper": round(el + 1.96 * se, 3),
                    "interpretation": INTERPRETATIONS.get(cat, f"Estimated demand elasticity: {el:.2f}")
                }
            if data:
                return data
        except Exception:
            pass
    return DEFAULT_ELASTICITY_DATA

@router.get("/estimates", response_model=List[ElasticityItem])
def get_elasticity_estimates(current_user: User = Depends(get_current_user)):
    return list(get_elasticity_dict().values())

@router.post("/simulate", response_model=ElasticitySimulateResponse)
def simulate_price_change(
    payload: ElasticitySimulateRequest,
    current_user: User = Depends(get_current_user)
):
    cat_upper = payload.category.upper()
    data = get_elasticity_dict()
    if cat_upper not in data:
        raise HTTPException(status_code=400, detail=f"Category '{payload.category}' not recognized.")

    cat_data = data[cat_upper]
    e = cat_data["elasticity"]
    se = cat_data["std_err"]
    p_ratio = 1.0 + (payload.price_change_pct / 100.0)

    if p_ratio <= 0:
        raise HTTPException(status_code=400, detail="Price reduction cannot exceed 100%.")

    # Constant elasticity model: Q_new / Q_old = (P_new / P_old) ^ e
    units_ratio = p_ratio ** e
    units_change_pct = (units_ratio - 1.0) * 100.0

    # Revenue ratio = (P_new / P_old) * (Q_new / Q_old)
    rev_ratio = p_ratio * units_ratio
    rev_change_pct = (rev_ratio - 1.0) * 100.0

    # 95% Confidence Interval bounds
    bound_1 = (p_ratio ** (e - 1.96 * se) - 1.0) * 100.0
    bound_2 = (p_ratio ** (e + 1.96 * se) - 1.0) * 100.0
    ci_low = min(bound_1, bound_2)
    ci_high = max(bound_1, bound_2)

    return ElasticitySimulateResponse(
        category=cat_upper,
        price_change_pct=payload.price_change_pct,
        expected_units_change_pct=round(units_change_pct, 2),
        expected_revenue_change_pct=round(rev_change_pct, 2),
        confidence_interval_95={"lower_pct": round(ci_low, 2), "upper_pct": round(ci_high, 2)},
        disclaimer=(
            "Econometric Notice: Simulated demand impacts represent historical fixed-effects regression "
            "associations based on log-price coefficients. Results assume ceteris paribus (all competitor "
            "pricing, macro conditions, and seasonal trends remain constant) and do not guarantee causal future performance."
        )
    )
