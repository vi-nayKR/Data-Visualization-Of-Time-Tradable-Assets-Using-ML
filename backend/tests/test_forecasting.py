import json
import numpy as np
import pandas as pd
import pytest

from app.ml.features import dataset, features, folds
from app.ml.metrics import directional_interval, metrics, return_to_price
from app.ml.models import pipeline
from app.services.company_service import CompanyService, DATA


def bars(returns):
    close = 100*np.exp(np.cumsum(returns))
    return pd.DataFrame({"Open": close, "High": close*1.01, "Low": close*.99,
                         "Close": close, "Volume": np.arange(len(close))+1000},
                        index=pd.bdate_range("2020-01-01", periods=len(close)))


def test_causal_features_and_splits():
    data = bars(np.random.default_rng(42).normal(0, .01, 800))
    complete = features(data)
    for t in (60, 100, 400, 700):
        pd.testing.assert_series_equal(complete.iloc[t], features(data.iloc[:t+1]).iloc[-1])
    for horizon in (1, 5):
        frame, columns, train, test = dataset(data, horizon)
        assert len(test) == 60
        assert train[-1]+horizon < test[0]
        for fit, valid in folds(train, horizon):
            assert fit[-1]+horizon < valid[0] < valid[-1] < test[0]
            assert len(valid) == 40
            model = pipeline("linear_regression", 1).fit(frame[columns].iloc[fit], frame.target.iloc[fit])
            np.testing.assert_allclose(model[0].mean_, frame[columns].iloc[fit].mean())


def test_metrics_and_conversion():
    np.testing.assert_allclose(return_to_price([100, 200], np.log([1.1, .9])), [110, 180])
    result = metrics(np.array([.1, -.1]), np.array([0., 0.]), np.array([100.,100.]), .1)
    assert result["mae_return"] == pytest.approx(.1)
    assert result["rmse_return"] == pytest.approx(.1)
    assert result["skill_vs_naive"] == 0
    assert result["directional_accuracy"] == 0
    assert result["mae_price"] == pytest.approx(np.mean([100*np.exp(.1)-100,100-100*np.exp(-.1)]))
    assert result["mape_price"] == pytest.approx(np.mean([1-np.exp(-.1),np.exp(.1)-1]))
    low, high = directional_interval(50,100)
    assert low == pytest.approx(.40383153)
    assert high == pytest.approx(.59616847)
    assert directional_interval(0,60)[0] >= -1e-15
    assert directional_interval(60,60)[1] <= 1+1e-15
    with pytest.raises(ValueError):
        metrics([], [], [], 0)


def test_catalog():
    service = CompanyService()
    official = json.loads((DATA / "tickers_in.json").read_text())
    assert official["source_url"].startswith("https://www.niftyindices.com/")
    assert len(official["tickers"])+len(official["dropped"]) == 51
    assert {c["ticker"] for c in service.get_all_companies()} == {"AAPL","MSFT","AMZN","GOOGL","META","TSLA","NVDA"}
    for market in ("in", "us"):
        companies = service.get_all_companies(market)
        assert len({c["ticker"] for c in companies}) == len(companies)
        assert all(c["market"] == market and c["currency"] == ("INR" if market=="in" else "USD") for c in companies)


@pytest.mark.parametrize("kind", ["random_walk", "trend"])
def test_synthetic_skill(kind):
    from app.ml.evaluate import evaluate
    random = np.random.default_rng(42)
    returns = random.normal(0, .01, 800) if kind == "random_walk" else .003+random.normal(0, .0003, 800)
    result = evaluate(bars(returns), 5)
    models = {m["name"]:m for m in result["models"]}
    if kind == "random_walk":
        assert max(m["metrics"]["skill_vs_naive"] for name,m in models.items() if name not in ("naive","drift","sma")) < .2
    else:
        assert models["linear_regression"]["metrics"]["skill_vs_naive"] > 0


def test_determinism():
    from app.ml.evaluate import evaluate
    data = bars(np.random.default_rng(7).normal(0,.01,700))
    assert evaluate(data, 1) == evaluate(data, 1)
