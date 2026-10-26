window.DASHBOARD_DATA = {
  "weekly_trend": [
    {
      "week_end_date": "2011-07-27",
      "units": 63392,
      "pred": 67400.4,
      "error": 4008.4,
      "abs_pct_err": 6.32
    },
    {
      "week_end_date": "2011-08-03",
      "units": 72534,
      "pred": 64486.3,
      "error": -8047.7,
      "abs_pct_err": 11.1
    },
    {
      "week_end_date": "2011-08-10",
      "units": 57832,
      "pred": 62328.3,
      "error": 4496.3,
      "abs_pct_err": 7.77
    },
    {
      "week_end_date": "2011-08-17",
      "units": 57260,
      "pred": 58519.3,
      "error": 1259.3,
      "abs_pct_err": 2.2
    },
    {
      "week_end_date": "2011-08-24",
      "units": 53438,
      "pred": 55526.6,
      "error": 2088.6,
      "abs_pct_err": 3.91
    },
    {
      "week_end_date": "2011-08-31",
      "units": 49757,
      "pred": 54408.4,
      "error": 4651.4,
      "abs_pct_err": 9.35
    },
    {
      "week_end_date": "2011-09-07",
      "units": 56140,
      "pred": 55182.3,
      "error": -957.7,
      "abs_pct_err": 1.71
    },
    {
      "week_end_date": "2011-09-14",
      "units": 59779,
      "pred": 55996.3,
      "error": -3782.7,
      "abs_pct_err": 6.33
    },
    {
      "week_end_date": "2011-09-21",
      "units": 57576,
      "pred": 54753.7,
      "error": -2822.3,
      "abs_pct_err": 4.9
    },
    {
      "week_end_date": "2011-09-28",
      "units": 54751,
      "pred": 53442.7,
      "error": -1308.3,
      "abs_pct_err": 2.39
    },
    {
      "week_end_date": "2011-10-05",
      "units": 56255,
      "pred": 51005.7,
      "error": -5249.3,
      "abs_pct_err": 9.33
    },
    {
      "week_end_date": "2011-10-12",
      "units": 59322,
      "pred": 59235.8,
      "error": -86.2,
      "abs_pct_err": 0.15
    },
    {
      "week_end_date": "2011-10-19",
      "units": 49740,
      "pred": 53179.7,
      "error": 3439.7,
      "abs_pct_err": 6.92
    },
    {
      "week_end_date": "2011-10-26",
      "units": 46141,
      "pred": 48086.8,
      "error": 1945.8,
      "abs_pct_err": 4.22
    },
    {
      "week_end_date": "2011-11-02",
      "units": 56184,
      "pred": 54694.8,
      "error": -1489.2,
      "abs_pct_err": 2.65
    },
    {
      "week_end_date": "2011-11-09",
      "units": 52319,
      "pred": 50708.9,
      "error": -1610.1,
      "abs_pct_err": 3.08
    },
    {
      "week_end_date": "2011-11-16",
      "units": 53725,
      "pred": 49243.9,
      "error": -4481.1,
      "abs_pct_err": 8.34
    },
    {
      "week_end_date": "2011-11-23",
      "units": 73950,
      "pred": 65887.2,
      "error": -8062.8,
      "abs_pct_err": 10.9
    },
    {
      "week_end_date": "2011-11-30",
      "units": 60048,
      "pred": 59677.5,
      "error": -370.5,
      "abs_pct_err": 0.62
    },
    {
      "week_end_date": "2011-12-07",
      "units": 82656,
      "pred": 73562.7,
      "error": -9093.3,
      "abs_pct_err": 11.0
    },
    {
      "week_end_date": "2011-12-14",
      "units": 76231,
      "pred": 72693.8,
      "error": -3537.2,
      "abs_pct_err": 4.64
    },
    {
      "week_end_date": "2011-12-21",
      "units": 66469,
      "pred": 62312.6,
      "error": -4156.4,
      "abs_pct_err": 6.25
    },
    {
      "week_end_date": "2011-12-28",
      "units": 50941,
      "pred": 59331.1,
      "error": 8390.1,
      "abs_pct_err": 16.47
    },
    {
      "week_end_date": "2012-01-04",
      "units": 64489,
      "pred": 70705.5,
      "error": 6216.5,
      "abs_pct_err": 9.64
    }
  ],
  "model_comparison": [
    {
      "model": "XGBoost (Poisson)",
      "val_MAE": 5.831364239234543,
      "val_RMSE": 11.9123672973041,
      "val_WAPE_%": 29.84970447104416,
      "val_R2": 0.8270422687416067,
      "val_n": 80485,
      "test_MAE": 5.221032198364674,
      "test_RMSE": 11.05496384331881,
      "test_WAPE_%": 29.0243225403437,
      "test_R2": 0.846844103849912,
      "test_n": 79547
    },
    {
      "model": "XGBoost (squared error)",
      "val_MAE": 5.851860560108689,
      "val_RMSE": 11.738319757504192,
      "val_WAPE_%": 29.954621450285583,
      "val_R2": 0.8320594001812364,
      "val_n": 80485,
      "test_MAE": 5.359126334977057,
      "test_RMSE": 11.32994302588375,
      "test_WAPE_%": 29.79200383585908,
      "test_R2": 0.8391302007996848,
      "test_n": 79547
    },
    {
      "model": "LightGBM",
      "val_MAE": 5.912815467162864,
      "val_RMSE": 11.835749577225148,
      "val_WAPE_%": 30.266638653633173,
      "val_R2": 0.829259965852122,
      "val_n": 80485,
      "test_MAE": 5.35537920899649,
      "test_RMSE": 11.117318716778112,
      "test_WAPE_%": 29.77117312864886,
      "test_R2": 0.8451114976084044,
      "test_n": 79547
    },
    {
      "model": "Random Forest",
      "val_MAE": 5.977050888608564,
      "val_RMSE": 12.42147196236596,
      "val_WAPE_%": 30.5954482199824,
      "val_R2": 0.8119428044262766,
      "val_n": 80485,
      "test_MAE": 5.351465843651456,
      "test_RMSE": 11.72924387960893,
      "test_WAPE_%": 29.749418277562505,
      "test_R2": 0.8275913303871978,
      "test_n": 79547
    },
    {
      "model": "Naive (last week)",
      "val_MAE": 8.737449193939318,
      "val_RMSE": 20.961037549432525,
      "val_WAPE_%": 44.71097519555176,
      "val_R2": 0.464633218628698,
      "val_n": 80453,
      "test_MAE": 7.60017349324885,
      "test_RMSE": 20.552117716468192,
      "test_WAPE_%": 42.24797262732404,
      "test_R2": 0.4706862031708713,
      "test_n": 79542
    },
    {
      "model": "Seasonal naive (52w)",
      "val_MAE": 11.624982333517494,
      "val_RMSE": 27.62107243121666,
      "val_WAPE_%": 57.97868182033724,
      "val_R2": 0.0913489548627153,
      "val_n": 77831,
      "test_MAE": 10.69801942145584,
      "test_RMSE": 26.166915636536952,
      "test_WAPE_%": 58.605770141772645,
      "test_R2": 0.1536814214256634,
      "test_n": 78058
    }
  ],
  "elasticity": [
    {
      "category": "BAG SNACKS",
      "elasticity": -0.5415557789912562,
      "std_err": 0.0180271967539086,
      "n": 80000
    },
    {
      "category": "COLD CEREAL",
      "elasticity": -1.6256569655961166,
      "std_err": 0.0197192436447835,
      "n": 80000
    },
    {
      "category": "FROZEN PIZZA",
      "elasticity": -2.201230350803768,
      "std_err": 0.0182327072938742,
      "n": 80000
    },
    {
      "category": "ORAL HYGIENE PRODUCTS",
      "elasticity": -0.9481114626722378,
      "std_err": 0.0134745808702949,
      "n": 80000
    }
  ],
  "promo_lift": [
    {
      "category": "BAG SNACKS",
      "0": 20.045925472738546,
      "1": 35.14046187915217,
      "lift_x": 1.752997731481215,
      "promo": "feature"
    },
    {
      "category": "COLD CEREAL",
      "0": 28.04586301048502,
      "1": 93.89327990135637,
      "lift_x": 3.3478477687156247,
      "promo": "feature"
    },
    {
      "category": "FROZEN PIZZA",
      "0": 9.28678915324496,
      "1": 25.96763754045308,
      "lift_x": 2.7961911390418024,
      "promo": "feature"
    },
    {
      "category": "ORAL HYGIENE PRODUCTS",
      "0": 4.147656668087692,
      "1": 10.21023181454836,
      "lift_x": 2.4616868346665406,
      "promo": "feature"
    },
    {
      "category": "BAG SNACKS",
      "0": 16.926295519782602,
      "1": 44.31567288166882,
      "lift_x": 2.618155451077578,
      "promo": "display"
    },
    {
      "category": "COLD CEREAL",
      "0": 28.75108236297608,
      "1": 92.30302218052672,
      "lift_x": 3.210419037976428,
      "promo": "display"
    },
    {
      "category": "FROZEN PIZZA",
      "0": 9.369468723312282,
      "1": 27.746034662257333,
      "lift_x": 2.961324220360767,
      "promo": "display"
    },
    {
      "category": "ORAL HYGIENE PRODUCTS",
      "0": 4.11857250329133,
      "1": 8.182900432900434,
      "lift_x": 1.9868292779503391,
      "promo": "display"
    },
    {
      "category": "BAG SNACKS",
      "0": 21.143281818522823,
      "1": 16.705658376711007,
      "lift_x": 0.7901166204990852,
      "promo": "tpr_only"
    },
    {
      "category": "COLD CEREAL",
      "0": 34.08233261396285,
      "1": 36.43450239003169,
      "lift_x": 1.0690143424955956,
      "promo": "tpr_only"
    },
    {
      "category": "FROZEN PIZZA",
      "0": 12.056321250664514,
      "1": 12.197749531152324,
      "lift_x": 1.01173063304696,
      "promo": "tpr_only"
    },
    {
      "category": "ORAL HYGIENE PRODUCTS",
      "0": 4.267912937003884,
      "1": 5.366363469312753,
      "lift_x": 1.257374165903204,
      "promo": "tpr_only"
    }
  ],
  "feature_importance": [
    {
      "feature": "roll_mean_13",
      "importance": 0.19136395
    },
    {
      "feature": "lag_1",
      "importance": 0.17246266
    },
    {
      "feature": "feature",
      "importance": 0.112253256
    },
    {
      "feature": "roll_mean_4",
      "importance": 0.08117634
    },
    {
      "feature": "tpr_only",
      "importance": 0.07779026
    },
    {
      "feature": "discount_pct",
      "importance": 0.04980913
    },
    {
      "feature": "display",
      "importance": 0.042529322
    },
    {
      "feature": "manufacturer_code",
      "importance": 0.028239494
    },
    {
      "feature": "price",
      "importance": 0.026406651
    },
    {
      "feature": "log_price",
      "importance": 0.024858184
    },
    {
      "feature": "roll_std_4",
      "importance": 0.024268247
    },
    {
      "feature": "sub_category_code",
      "importance": 0.023629533
    },
    {
      "feature": "category_code",
      "importance": 0.015248201
    },
    {
      "feature": "sales_area_size_num",
      "importance": 0.014627851
    },
    {
      "feature": "address_state_prov_code_code",
      "importance": 0.013198391
    },
    {
      "feature": "lag_4",
      "importance": 0.0129312
    },
    {
      "feature": "lag_13",
      "importance": 0.011340898
    },
    {
      "feature": "month",
      "importance": 0.011052353
    },
    {
      "feature": "msa_code_code",
      "importance": 0.010864308
    },
    {
      "feature": "week_of_year",
      "importance": 0.010687127
    },
    {
      "feature": "base_price",
      "importance": 0.009361353
    },
    {
      "feature": "upc_code",
      "importance": 0.008650969
    },
    {
      "feature": "lag_52",
      "importance": 0.008158935
    },
    {
      "feature": "lag_2",
      "importance": 0.0064045754
    },
    {
      "feature": "seg_value_name_code",
      "importance": 0.0053135552
    },
    {
      "feature": "store_num",
      "importance": 0.00422598
    },
    {
      "feature": "parking_space_qty",
      "importance": 0.0031473006
    }
  ],
  "store_tier": [
    {
      "feature": "display",
      "0": 0.0,
      "0.1": 1.0,
      "1": 0.0,
      "1.1": 1.0
    },
    {
      "feature": "seg_value_name",
      "0": NaN,
      "0.1": NaN,
      "1": NaN,
      "1.1": NaN
    },
    {
      "feature": "MAINSTREAM",
      "0": 15.2915166732605,
      "0.1": 34.435285815102326,
      "1": 35.75795285251073,
      "1.1": 63.75161924168547
    },
    {
      "feature": "UPSCALE",
      "0": 19.71261244682118,
      "0.1": 38.7346645596897,
      "1": 38.5428208386277,
      "1.1": 63.22965716646014
    },
    {
      "feature": "VALUE",
      "0": 12.350864027259451,
      "0.1": 27.55045267489712,
      "1": 28.365969930326365,
      "1.1": 58.993532234508656
    }
  ],
  "state_category": [
    {
      "address_state_prov_code": "IN",
      "BAG SNACKS": 19.59526938239159,
      "COLD CEREAL": 41.38939256572983,
      "FROZEN PIZZA": 16.276282051282053,
      "ORAL HYGIENE PRODUCTS": 4.249063670411985
    },
    {
      "address_state_prov_code": "KY",
      "BAG SNACKS": 24.89316132264529,
      "COLD CEREAL": 43.30403638430926,
      "FROZEN PIZZA": 12.929565654871707,
      "ORAL HYGIENE PRODUCTS": 4.199623352165725
    },
    {
      "address_state_prov_code": "OH",
      "BAG SNACKS": 23.50200637768725,
      "COLD CEREAL": 43.36092656568341,
      "FROZEN PIZZA": 14.124166833857196,
      "ORAL HYGIENE PRODUCTS": 5.17408368677597
    },
    {
      "address_state_prov_code": "TX",
      "BAG SNACKS": 15.848766868310843,
      "COLD CEREAL": 26.58408656066504,
      "FROZEN PIZZA": 10.30113617035752,
      "ORAL HYGIENE PRODUCTS": 3.966239662720934
    }
  ],
  "summary": {
    "total_actual_units": 1430929,
    "total_pred_units": 1412370.3,
    "best_model": "XGBoost (Poisson)",
    "test_r2": 0.847,
    "test_mae": 5.221,
    "test_wape": 29.02,
    "num_weeks": 24,
    "num_stores": 77,
    "num_products": 54
  }
};