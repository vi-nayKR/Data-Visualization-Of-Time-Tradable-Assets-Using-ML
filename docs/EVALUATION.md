# Leakage-free forecasting evaluation

## Methodology

The target is the forward log return, `ln(close[t+h] / close[t])`, at horizons of
one and five observed trading bars. Prices are displayed as `close[t] * exp(return)`.
Three years of daily OHLCV bars are cached without creating holiday bars or
forward-filling prices. Features use only information through day t: lagged
one-day log returns at lags 1, 2, 3, 5 and 10; rolling volatility over 5 and 20
bars; close/SMA minus one at windows 10, 20 and 50; RSI14; and volume z-score20.
Warm-up rows are removed.

The last 60 fully observable forecast origins form the hold-out. A horizon-sized
gap purges overlapping training targets before the hold-out. The remaining data
uses five expanding-window validation folds of 40 bars each, separated from
training by the same horizon-sized gap. Ridge alpha and tree depth are selected
by mean validation return MAE. SVR uses linear and RBF kernels. Every sklearn
model uses a training-only StandardScaler pipeline. The CPU LSTM uses 30-bar
feature sequences, one 32-unit layer, fixed seeds, two torch threads and
validation early stopping. Its final training epoch count comes from the folds.

Models are refitted on non-test data after validation choices are frozen.
Hold-out data never chooses a hyperparameter or the winning model. The winner
has the lowest validation MAE, including the baselines. The naive baseline predicts
zero return (price stays the same); drift predicts the training mean target;
SMA predicts reversion to SMA20. All eight approaches appear in the leaderboard.

Hold-out reporting includes return MAE/RMSE, price MAE/MAPE, sign-hit directional
accuracy with a 95% Wilson binomial interval, and `1 - model MAE / naive MAE`.
Positive skill beats naive; a zero-return prediction only counts as a direction
hit when the actual return is also zero. Undefined skill is null when naive MAE
is zero. Bands use the 10th and 90th percentiles of validation residuals,
converted to prices. They are empirical bands, not calibrated coverage guarantees.
Chart connectors illustrate the final horizon endpoint; they are not daily forecasts.

## Results

The completed deployment report records the table generated from h=5 artifacts
by `scripts/report_evaluation.py`. It reports the validation winner's hold-out
skill for each ticker, including when the winner is a baseline. Market directional
accuracy is the equal-weight ticker mean; its descriptive 95% interval uses 5,000
seeded ticker bootstrap samples. Correlation between tickers and overlapping
horizon targets limits interpretation of these intervals.

| Market | Tickers | Median winner skill | Winner beats naive | Mean directional accuracy (95% ticker bootstrap CI) |
| --- | ---: | ---: | ---: | ---: |
| India (NSE) | 51 | 0.00% | 4/51 (7.8%) | 20.9% (14.3%-27.8%) |
| United States | 7 | -3.44% | 0/7 (0.0%) | 24.8% (7.4%-40.2%) |

Artifacts were trained on 2026-10-07 from commit 67a9517. India data is dated 2026-10-07 and US data 2026-10-06. After an initial rollback for a stock-data reader bug, the corrected API was redeployed; these offline evaluation artifacts were unchanged.

## Serving and operations

Forecast requests only read atomically published JSON artifacts. Unknown or
untrained symbols return 404 `not trained yet`; requests never train a model.
The 03:00 Asia/Kolkata systemd timer downloads and trains all tickers for h=1 and
h=5 under a 1200M memory limit, CPUQuota150%, Nice10 and a 45-minute timeout.
Failed training leaves previous complete artifact files intact and records the
failure in the index. A symbol's two horizons publish separately; status marks it
successful only after both finish. A lock prevents overlapping training runs.
The static snapshot contains both markets at h=5 only. Falling back from h=1
switches the UI to h=5 rather than relabelling saved data as a one-day forecast.

## Relation to the IEEE NMITCON 2023 paper

The [paper's published results](https://doi.org/10.1109/NMITCON58196.2023.10275962)
stand as published. This v2 re-evaluates the demo with leakage-free validation,
and its numbers are not comparable to the paper's.

## Known limitations

Daily data may be approximately 15 minutes delayed; a manual initial training
run during market hours can include an incomplete latest daily bar. Raw close
prices can reflect corporate actions. Data coverage, survivorship of the current
constituent list, small evaluation samples and regime changes limit generalisation.
No transaction costs, slippage or executable trading strategy are modelled.
An empirical validation band can miss future prices. Not financial advice.

The [official Nifty constituent CSV](https://www.niftyindices.com/IndexConstituent/ind_nifty50list.csv)
and its retrieval date are recorded with the catalog. All 51 NSE symbols resolved;
none were dropped. US sector metadata was not present in the original catalog
and is explicitly unspecified.
