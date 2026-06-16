import urllib
import xlrd
import pandas as pd
import numpy as np
import streamlit as st
import yfinance as yf
import seaborn as sns
import plotly.graph_objs as go
from sklearn.svm import SVR
from sklearn.tree import DecisionTreeRegressor
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import MinMaxScaler
from sklearn.preprocessing import MinMaxScaler
try:
    from keras.models import Sequential
    from keras.layers import Dense, Dropout, LSTM
    HAS_LSTM = True
except ImportError:
    HAS_LSTM = False
scaler = MinMaxScaler()
#####################################################################################################################

companies = {}
xls = xlrd.open_workbook("cname.xls")
sh = xls.sheet_by_index(0)
for i in range(505):
    cell_value_class = sh.cell(i, 0).value
    cell_value_id = sh.cell(i, 1).value
    companies[cell_value_class] = cell_value_id

############################################################################

def company_name():
    company = st.sidebar.selectbox("Companies", list(companies.keys()), 0)
    return company
# company = company_name()

############################################################################
def prediction_graph(algo, confidence, cdata):
    st.header(algo + ', Confidence score is ' + str(round(confidence, 2)))
    fig6 = go.Figure(data=[go.Scatter(x=list(cdata.index), y=list(cdata.Close), name='Close'),
                           # go.Scatter(x=list(chart_data.index), y=list(chart_data.Vclose), name='Vclose'),
                           go.Scatter(x=list(cdata.index), y=list(cdata.Vpredictions),
                                      name='Predictions')])

    fig6.update_layout(width=850, height=550)
    fig6.update_xaxes(rangeslider_visible=True,
                      rangeselector=dict(
                          buttons=list([
                              dict(count=30, label="30D", step="day", stepmode="backward"),
                              dict(count=60, label="60D", step="day", stepmode="backward"),
                              dict(count=90, label="90D", step="day", stepmode="backward"),
                              dict(count=120, label="120D", step="day", stepmode="backward"),
                              dict(count=150, label="150D", step="day", stepmode="backward"),
                              dict(step="all")
                          ])
                      ))
    st.plotly_chart(fig6)

#############################################################################################
def prediction():
    def data_download():
        company = company_name()
        data = yf.download(tickers=companies[company], period='200d', interval='1d', auto_adjust=False)
        if isinstance(data.columns, pd.MultiIndex):
            data.columns = data.columns.droplevel(1)

        def divide(j):
            j = j / 1000000
            return j

        data['Volume'] = data['Volume'].apply(divide)
        data.rename(columns={'Volume': 'Volume (in millions)'}, inplace=True)
        return data

    df = data_download()

    pred = st.sidebar.radio("Regression Type", [ "Linear Regression", "SVR Prediction",
                                                "RBF Prediction","Tree Prediction", "Polynomial Prediction", "LSTM"])

    # removing index which is date
    df['Date'] = df.index
    df.reset_index(drop=True, inplace=True)

    # rearranging the columns
    df = df[['Date', 'Open', 'High', 'Low', 'Close', 'Adj Close', 'Volume (in millions)']]
    df['Close'] = scaler.fit_transform(df[['Close']])
    df = df[['Close']]

    # create a variable to predict 'x' days out into the future
    future_days = 50
    # create a new column( target) shifted 'x' units/days up
    df['Prediction'] = df[['Close']].shift(-future_days)

    # create the feature data set (x) and convet it to a numpy array and remove the last 'x' rows
    x = np.array(df.drop(['Prediction'], axis=1))[:-future_days]

    # create a new target dataset (y) and convert it to a numpy array and get all of the target values except the last'x' rows)
    y = np.array(df['Prediction'])[:-future_days]

    # split the data into 75% training and 25% testing
    x_train, x_test, y_train, y_test = train_test_split(x, y, test_size=0.25)

    # create the models
    # create the decision treee regressor model
    tree = DecisionTreeRegressor().fit(x_train, y_train)
    # create the linear regression model
    lr = LinearRegression().fit(x_train, y_train)

    # create the svr model
    svr_rbf = SVR(C=1e3, gamma=.1)
    svr_rbf.fit(x_train, y_train)

    # create the RBF model
    rbf_svr = SVR(kernel='rbf', C=1000.0, gamma=.85)
    rbf_svr.fit(x_train, y_train)



    # create the linear 2 model
    lin_svr = SVR(kernel='linear', C=1000.0, gamma=.85)
    lin_svr.fit(x_train, y_train)

    # get the last x rows of the feature dataset
    x_future = df.drop(['Prediction'], axis=1)[:-future_days]
    x_future = x_future.tail(future_days)
    x_future = np.array(x_future)

    # show the model tree prediction
    tree_prediction = tree.predict(x_future)

    # show the model linear regression prediction
    lr_prediction = lr.predict(x_future)

    # show the model SVR prediction
    SVR_prediction = svr_rbf.predict(x_future)

    # show the model RBF prediction
    RBF_prediction = rbf_svr.predict(x_future)



    if pred == "Linear Regression":
        predictions = lr_prediction
        valid = df[x.shape[0]:].copy()
        valid['predictions'] = predictions

        # alter
        data = {'Close': [], 'Vclose': [], 'Vpredictions': []}
        mod = pd.DataFrame(data)
        mod.index.name = 'index'
        mod.Close = df.Close

        mod.loc[148:, 'Vpredictions'] = valid.predictions
        #mod.Close = df.Close.loc[:200]
        chart_data = mod
        lin_confidence = lr.score(x_test, y_test)
        prediction_graph(pred, lin_confidence, chart_data)

    elif pred == "Tree Prediction":
        predictions = tree_prediction
        valid = df[x.shape[0]:].copy()
        valid['predictions'] = predictions

        # alter
        data = {'Close': [], 'Vclose': [], 'Vpredictions': []}
        mod = pd.DataFrame(data)
        mod.index.name = 'index'
        mod.Close = df.Close

        mod.loc[148:, 'Vpredictions'] = valid.predictions
        # mod.Close = df.Close.loc[:150]
        chart_data = mod
        tree_confidence = tree.score(x_test, y_test)
        prediction_graph(pred, tree_confidence, chart_data)

    elif pred == "SVR Prediction":
        predictions = SVR_prediction
        valid = df[x.shape[0]:].copy()
        valid['predictions'] = predictions

        # alter
        data = {'Close': [], 'Vclose': [], 'Vpredictions': []}
        mod = pd.DataFrame(data)
        mod.index.name = 'index'
        mod.Close = df.Close

        mod.loc[148:, 'Vpredictions'] = valid.predictions
        # mod.Close = df.Close.loc[:150]
        chart_data = mod
        svr_confidence = svr_rbf.score(x_test, y_test)
        prediction_graph(pred, svr_confidence, chart_data)

    elif pred == "RBF Prediction":
        predictions = RBF_prediction
        valid = df[x.shape[0]:].copy()
        valid['predictions'] = predictions

        # alter
        data = {'Close': [], 'Vclose': [], 'Vpredictions': []}
        mod = pd.DataFrame(data)
        mod.index.name = 'index'
        mod.Close = df.Close

        
        mod.loc[148:, 'Vpredictions'] = valid.predictions
        
        chart_data = mod
        rbf_confidence = rbf_svr.score(x_test, y_test)
        prediction_graph(pred, rbf_confidence, chart_data)

    elif pred == "Polynomial Prediction":
        st.markdown("Polynomial comes here")
    elif pred == "LSTM":
        st.markdown("LSTM comes here")

##################################################################################

if __name__ == "__main__":
    prediction()