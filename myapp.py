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
scaler = MinMaxScaler()
import matplotlib.pyplot as plt
plt.style.use('bmh')
# import quandl
import matplotlib.animation as ani
import altair as alt
from sklearn.preprocessing import MinMaxScaler
try:
    import torch
    import torch.nn as nn
    import torch.optim as optim
    HAS_LSTM = True

    class PyTorchLSTM(nn.Module):
        def __init__(self, input_size=1, hidden_size=50, num_layers=2, output_size=1):
            super(PyTorchLSTM, self).__init__()
            self.hidden_size = hidden_size
            self.num_layers = num_layers
            self.lstm = nn.LSTM(input_size, hidden_size, num_layers, batch_first=True)
            self.fc = nn.Linear(hidden_size, output_size)

        def forward(self, x):
            h0 = torch.zeros(self.num_layers, x.size(0), self.hidden_size).to(x.device)
            c0 = torch.zeros(self.num_layers, x.size(0), self.hidden_size).to(x.device)
            out, _ = self.lstm(x, (h0, c0))
            out = self.fc(out[:, -1, :])
            return out
except ImportError:
    HAS_LSTM = False

def main():
    st.set_page_config(page_title="Data Visualization of Time Tradable Assets", page_icon="📈", layout="wide")
    
    # Custom CSS for premium modern dark UI and styled sidebar
    st.markdown("""
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
            
            /* Hide Streamlit default top Deploy button, Fork button, GitHub link, and header actions, keep 3-dots settings */
            .stAppDeployButton,
            button[data-testid="stHeaderDeployButton"],
            [data-testid="stHeader"] button:not(:last-child),
            [data-testid="stHeader"] a,
            [data-testid="stHeader"] iframe,
            header a,
            header iframe,
            #GithubIcon,
            [data-testid="stHeader"] #GithubIcon,
            a[href*="github.com/vi-nayKR"],
            a[href*="github.com/Lakshya-Ag"] {
                display: none !important;
            }
            
            html, body, [class*="css"] {
                font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, 'Outfit', sans-serif !important;
            }
            
            /* Center all page headers (h1, h2, h3) in main tabs */
            h1, h2, h3, [data-testid="stAppViewContainer"] h1, [data-testid="stAppViewContainer"] h2 {
                text-align: center !important;
            }
                      /* Microsoft Azure-style sidebar styling */
            [data-testid="stSidebar"] {
                background-color: #181818 !important;
                border-right: 1px solid #323130 !important;
                container-type: inline-size !important;
                container-name: sidebar !important;
            }
            [data-testid="stSidebarUserContent"] {
                background-color: #181818 !important;
                padding-left: 1rem !important;
                padding-right: 1rem !important;
                container-type: inline-size !important;
                container-name: sidebar !important;
            }
            
            /* Sidebar Title styling - Microsoft Fluent style */
            .sidebar-header {
                display: flex !important;
                flex-direction: row !important;
                align-items: center !important;
                justify-content: flex-start !important;
                margin-top: 1.5rem !important;
                margin-bottom: 2rem !important;
                padding-left: 0.25rem !important;
                padding-right: 0.25rem !important;
                width: 100% !important;
                gap: 0.75rem !important;
                border-bottom: 1px solid #323130 !important;
                padding-bottom: 1.25rem !important;
            }
            .sidebar-logo {
                font-size: 1.4rem !important;
                color: #0078d4 !important;
                display: inline-block !important;
            }
            .sidebar-title {
                font-weight: 600 !important;
                font-size: 0.88rem !important;
                color: #ffffff !important;
                text-transform: uppercase !important;
                letter-spacing: 0.05rem !important;
                white-space: normal !important;
                text-align: left !important;
                line-height: 1.35 !important;
                display: block !important;
                flex-shrink: 1 !important;
                font-family: 'Segoe UI', -apple-system, sans-serif !important;
            }
            
            /* Microsoft Fluent Sidebar Inputs (Selectbox & inputs) */
            [data-testid="stSidebar"] div[data-baseweb="select"], 
            [data-testid="stSidebar"] div[data-baseweb="input"] {
                background-color: #252525 !important;
                border: 1px solid #605e5c !important;
                border-radius: 4px !important;
                transition: all 0.15s ease-in-out;
            }
            [data-testid="stSidebar"] div[data-baseweb="select"]:hover, 
            [data-testid="stSidebar"] div[data-baseweb="input"]:hover {
                border-color: #a19f9d !important;
            }
            [data-testid="stSidebar"] div[data-baseweb="select"]:focus-within, 
            [data-testid="stSidebar"] div[data-baseweb="input"]:focus-within {
                border-color: #0078d4 !important;
                box-shadow: 0 0 0 1px #0078d4 !important;
            }
            
            /* Sidebar labels & paragraphs */
            [data-testid="stSidebar"] label, [data-testid="stSidebar"] p {
                color: #cccccc !important;
                font-weight: 500 !important;
                text-align: left !important;
                font-size: 0.85rem !important;
                margin-bottom: 0.25rem !important;
            }

            /* Microsoft Fluent Menu Navigation (Radio Buttons as navigation lists) */
            [data-testid="stSidebar"] div[role="radiogroup"] {
                display: flex !important;
                flex-direction: column !important;
                width: 100% !important;
                gap: 0.25rem !important;
            }
            [data-testid="stSidebar"] div[role="radiogroup"] label {
                width: 100% !important;
                background: transparent !important;
                border: 1px solid transparent !important;
                border-radius: 4px !important;
                padding: 0.5rem 0.75rem !important;
                margin-bottom: 0 !important;
                transition: all 0.15s ease-in-out !important;
                display: flex !important;
                align-items: center !important;
                justify-content: flex-start !important;
                cursor: pointer !important;
            }
            [data-testid="stSidebar"] div[role="radiogroup"] label:hover {
                background-color: #252525 !important;
                border-color: #323130 !important;
            }
            [data-testid="stSidebar"] div[role="radiogroup"] label:has(input:checked) {
                background-color: #292929 !important;
                border-color: #0078d4 !important;
                border-left: 4px solid #0078d4 !important;
                font-weight: 600 !important;
            }
            [data-testid="stSidebar"] div[role="radiogroup"] label:has(input:checked) span {
                color: #ffffff !important;
            }
            
            /* Hide the default radio circle indicator to look like clean Azure sidebar menu items */
            [data-testid="stSidebar"] div[role="radiogroup"] div[data-baseweb="radio"] > div {
                display: none !important;
            }
            
            .header-emoji {
                font-size: 3rem;
                vertical-align: middle;
                margin-right: 0.5rem;
            }
            .header-gradient {
                background: linear-gradient(135deg, #38bdf8, #818cf8, #c084fc);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                font-weight: 700;
                font-size: 3rem;
                margin-bottom: 0.2rem;
                letter-spacing: -0.05rem;
                vertical-align: middle;
                display: inline-block;
            }
            .subheader-style {
                font-weight: 400;
                font-size: 1.15rem;
                color: #94a3b8;
                margin-bottom: 2rem;
            }
            .feature-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
                gap: 1.5rem;
                margin: 2rem 0;
            }
            .feature-item {
                background: #1e293b;
                border: 1px solid #334155;
                padding: 1.5rem;
                border-radius: 12px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                transition: transform 0.2s ease, box-shadow 0.2s ease;
            }
            .feature-item:hover {
                transform: translateY(-4px);
                box-shadow: 0 12px 20px rgba(0, 0, 0, 0.2);
                border-color: #818cf8;
            }
            .feature-icon {
                font-size: 2rem;
                margin-bottom: 0.5rem;
            }
            .feature-title {
                font-weight: 600;
                font-size: 1.25rem;
                color: #f8fafc;
                margin-bottom: 0.25rem;
            }
            .feature-desc {
                font-size: 0.95rem;
                color: #94a3b8;
            }
            
            /* Responsive styling for phone screens */
            @media (max-width: 768px) {
                /* Reduce margins/padding on mobile screens to maximize space */
                .block-container {
                    padding-top: 1.5rem !important;
                    padding-bottom: 1.5rem !important;
                    padding-left: 0.75rem !important;
                    padding-right: 0.75rem !important;
                }
                .header-emoji {
                    font-size: 1.8rem !important;
                }
                .header-gradient {
                    font-size: 1.8rem !important;
                }
                h1, [data-testid="stAppViewContainer"] h1 {
                    font-size: 1.8rem !important;
                }
                h2, [data-testid="stAppViewContainer"] h2 {
                    font-size: 1.35rem !important;
                }
                h3, [data-testid="stAppViewContainer"] h3 {
                    font-size: 1.15rem !important;
                }
                [data-testid="stSidebar"] [data-testid="stSidebarUserContent"] {
                    padding-left: 0.5rem !important;
                    padding-right: 0.5rem !important;
                }
                .sidebar-header {
                    justify-content: center !important;
                    padding-left: 0px !important;
                    margin-top: 0.5rem !important;
                    margin-bottom: 1rem !important;
                }
                .sidebar-title {
                    font-size: 0.85rem !important;
                }
                .sidebar-emoji {
                    font-size: 0.85rem !important;
                }
                .feature-grid {
                    grid-template-columns: 1fr !important;
                    gap: 1rem !important;
                }
                .feature-item {
                    padding: 1.2rem !important;
                }
            }
            a {
                color: #38bdf8 !important;
                text-decoration: none;
            }
            a:hover {
                text-decoration: underline;
            }
            
            /* Modern, clean light theme sidebar styling */
            @media (prefers-color-scheme: light) {
                [data-testid="stSidebar"] {
                    background-color: #f8fafc !important; /* Soft Slate gray/white */
                    border-right: 1px solid #e2e8f0 !important; /* Crisp border */
                }
                [data-testid="stSidebarUserContent"] {
                    background-color: #f8fafc !important;
                }
                .sidebar-logo {
                    color: #0284c7 !important; /* Sky Blue logo */
                }
                .sidebar-title {
                    color: #0f172a !important; /* Slate Dark */
                }
                .sidebar-header {
                    border-bottom: 1px solid #e2e8f0 !important;
                }
                [data-testid="stSidebar"] label, [data-testid="stSidebar"] p {
                    color: #475569 !important; /* Slate-600 */
                }
                [data-testid="stSidebar"] div[data-baseweb="select"], 
                [data-testid="stSidebar"] div[data-baseweb="input"] {
                    background-color: #ffffff !important;
                    border: 1px solid #cbd5e1 !important;
                    border-radius: 6px !important;
                }
                [data-testid="stSidebar"] div[data-baseweb="select"] *, 
                [data-testid="stSidebar"] div[data-baseweb="input"] * {
                    color: #0f172a !important;
                }
                [data-testid="stSidebar"] div[role="radiogroup"] label {
                    border-radius: 6px !important;
                }
                [data-testid="stSidebar"] div[role="radiogroup"] label:hover {
                    background-color: #f1f5f9 !important; /* Slate-100 */
                    border-color: #cbd5e1 !important;
                }
                [data-testid="stSidebar"] div[role="radiogroup"] label:has(input:checked) {
                    background-color: #f0f9ff !important; /* Sky Blue-50 */
                    border-color: #0284c7 !important;
                    border-left: 4px solid #0284c7 !important;
                }
                [data-testid="stSidebar"] div[role="radiogroup"] label:has(input:checked) span {
                    color: #0369a1 !important; /* Sky Blue-700 */
                    font-weight: 600 !important;
                }
            }
        </style>
    """, unsafe_allow_html=True)

    st.sidebar.markdown('<div class="sidebar-header"><span class="sidebar-logo">📊</span><span class="sidebar-title">Data Visualization of Time Tradable Assets</span></div>', unsafe_allow_html=True)
    app_mode = st.sidebar.selectbox("Select App Mode", ["Home", "Data Analysis", "Prediction", "Best Analysis"])

    if app_mode == "Home":
        st.markdown('<h1><span class="header-emoji">📈</span><span class="header-gradient">Stock Market Dashboard</span></h1>', unsafe_allow_html=True)
        
        with open('README.md', 'r', encoding='utf-8') as fp:
            st.markdown(fp.read())
    elif app_mode == "Data Analysis":
        data_analysis()
    elif app_mode == "Prediction":
        prediction()
    elif app_mode == "Best Analysis":
        bprediction()
        

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

def show_data():
    show = st.sidebar.selectbox("Options", ["Graphs", "Company Data"], 0)
    return show
# show_data = show_data()

############################################################################

def get_file_content_as_string(path):
    import os
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            return f.read()
    try:
        url = 'https://raw.githubusercontent.com/Lakshya-Ag/Streamlit-Dashboard/master/' + path
        response = urllib.request.urlopen(url)
        return response.read().decode("utf-8")
    except Exception:
        return f"Error: Could not load {path}"

############################################################################
def prediction_graph(algo, confidence, cdata):
    st.header(algo + ', Confidence score is ' + str(round(confidence, 2)))
    fig6 = go.Figure(data=[go.Scatter(x=list(cdata.index), y=list(cdata.Close), name='Close'),
                           # go.Scatter(x=list(chart_data.index), y=list(chart_data.Vclose), name='Vclose'),
                           go.Scatter(x=list(cdata.index), y=list(cdata.Vpredictions),
                                      name='Predictions')])

    fig6.update_layout(height=550)
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
    st.plotly_chart(fig6, use_container_width=True)

#############################################################################

def bprediction():
    st.markdown('<h1 class="header-gradient">🏆 Best Model Selector</h1>', unsafe_allow_html=True)
    st.markdown('<p class="subheader-style" style="text-align: center;">Evaluates Linear Regression, Decision Tree, Support Vector Machines (SVR), and LSTM Neural Networks to select the most accurate predictor.</p>', unsafe_allow_html=True)
    
    scaler = MinMaxScaler(feature_range=(0, 1))
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
    if df is None or df.empty:
        st.error("Error: Downloaded data is empty. Yahoo Finance might be blocking the request, or the ticker may be delisted.")
        return
    df.dropna(inplace=True)
    if df.empty:
        st.error("Error: All downloaded data contains NaNs or is empty.")
        return

    # removing index which is date
    df['Date'] = df.index
    df.reset_index(drop=True, inplace=True)

    # rearranging the columns
    df = df[['Date', 'Open', 'High', 'Low', 'Close', 'Adj Close', 'Volume (in millions)']]
    df['Close'] = scaler.fit_transform(df[['Close']])
    df = df[['Close']]

    # create a variable to predict 'x' days out into the future
    future_days = 50
    if len(df) <= future_days:
        st.error(f"Error: Not enough data points (only {len(df)} available) to predict {future_days} days into the future. Need at least {future_days + 10} days of data.")
        return

    df['Prediction'] = df[['Close']].shift(-future_days)

    x = np.array(df.drop(['Prediction'], axis=1))[:-future_days]
    y = np.array(df['Prediction'])[:-future_days]

    # split the data into 75% training and 25% testing
    x_train, x_test, y_train, y_test = train_test_split(x, y, test_size=0.25)

    # 1. Decision Tree Regressor
    tree = DecisionTreeRegressor().fit(x_train, y_train)
    tree_confidence = tree.score(x_test, y_test)
    x_future = df.drop(['Prediction'], axis=1)[:-future_days].tail(future_days)
    x_future = np.array(x_future)
    tree_prediction = tree.predict(x_future)
    
    # 2. Linear Regression
    lr = LinearRegression().fit(x_train, y_train)
    lin_confidence = lr.score(x_test, y_test)
    lr_prediction = lr.predict(x_future)

    # 3. SVR (Default parameters)
    svr_rbf = SVR(C=1e3, gamma=.1).fit(x_train, y_train)
    svr_confidence = svr_rbf.score(x_test, y_test)
    SVR_prediction = svr_rbf.predict(x_future)

    # 4. RBF SVR (Custom parameters)
    rbf_svr = SVR(kernel='rbf', C=1000.0, gamma=.85).fit(x_train, y_train)
    rbf_confidence = rbf_svr.score(x_test, y_test)
    RBF_prediction = rbf_svr.predict(x_future)

    # 5. LSTM (PyTorch implementation)
    lstm_confidence = -999
    lstm_prediction = None
    
    if HAS_LSTM:
        # Load and scale Close column
        data_scaled = scaler.fit_transform(df[['Close']]).reshape(-1, 1)
        train_size = int(len(data_scaled) * 0.75)
        train_data = data_scaled[:train_size]
        test_data = data_scaled[train_size:]
        n_days = 40

        X_train_l, y_train_l = [], []
        for i in range(n_days, len(train_data)):
            X_train_l.append(train_data[i - n_days:i, 0])
            y_train_l.append(train_data[i, 0])
        X_train_l, y_train_l = np.array(X_train_l), np.array(y_train_l)
        X_train_l = np.reshape(X_train_l, (X_train_l.shape[0], X_train_l.shape[1], 1))

        inputs_l = data_scaled[len(data_scaled) - len(test_data) - n_days:]
        X_test_l = []
        for i in range(n_days, len(inputs_l)):
            X_test_l.append(inputs_l[i - n_days:i, 0])
        X_test_l = np.array(X_test_l)
        X_test_l = np.reshape(X_test_l, (X_test_l.shape[0], X_test_l.shape[1], 1))

        X_train_t = torch.FloatTensor(X_train_l)
        y_train_t = torch.FloatTensor(y_train_l).unsqueeze(1)
        X_test_t = torch.FloatTensor(X_test_l)
        test_data_t = torch.FloatTensor(test_data)

        device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        model = PyTorchLSTM().to(device)
        criterion = nn.MSELoss()
        optimizer = optim.Adam(model.parameters(), lr=0.001)

        dataset = torch.utils.data.TensorDataset(X_train_t, y_train_t)
        loader = torch.utils.data.DataLoader(dataset, batch_size=32, shuffle=True)

        model.train()
        for epoch in range(10):
            for batch_x, batch_y in loader:
                batch_x, batch_y = batch_x.to(device), batch_y.to(device)
                optimizer.zero_grad()
                outputs = model(batch_x)
                loss = criterion(outputs, batch_y)
                loss.backward()
                optimizer.step()

        model.eval()
        with torch.no_grad():
            predictions_t = model(X_test_t.to(device))
            from sklearn.metrics import r2_score
            lstm_confidence = r2_score(test_data_t.cpu().numpy(), predictions_t.cpu().numpy())
            predictions = predictions_t.cpu().numpy()
            lstm_prediction = scaler.inverse_transform(predictions)

    # Let's map out the performance
    models_info = {
        "Linear Regression": {"score": lin_confidence, "pred": lr_prediction},
        "Decision Tree": {"score": tree_confidence, "pred": tree_prediction},
        "SVR (RBF Default)": {"score": svr_confidence, "pred": SVR_prediction},
        "RBF SVR (Custom)": {"score": rbf_confidence, "pred": RBF_prediction}
    }
    
    if HAS_LSTM and lstm_prediction is not None:
        lstm_flat_pred = [da[0] for da in lstm_prediction]
        models_info["LSTM Neural Network"] = {"score": lstm_confidence, "pred": lstm_flat_pred}
    else:
        models_info["LSTM Neural Network"] = {"score": -999, "pred": None}

    # Find best model
    best_model_name = max(models_info, key=lambda k: models_info[k]["score"])
    best_score = models_info[best_model_name]["score"]
    best_prediction = models_info[best_model_name]["pred"]

    # Render metrics side by side
    st.markdown("### 📊 Model Comparison")
    cols = st.columns(len(models_info))
    for i, (name, info) in enumerate(models_info.items()):
        is_best = (name == best_model_name)
        with cols[i]:
            badge = ""
            border_color = "#334155"
            bg_color = "#1e293b"
            text_color = "#f8fafc"
            
            if is_best:
                border_color = "#22c55e"
                bg_color = "linear-gradient(135deg, #14532d 0%, #064e3b 100%)"
                badge = '<span style="background-color:#22c55e; color:#ffffff; padding:0.2rem 0.5rem; border-radius:12px; font-size:0.65rem; font-weight:700; position:absolute; top: -10px; right: 10px;">WINNER</span>'
                
            score_val = info["score"]
            score_text = f"{round(score_val * 100, 2)}%" if score_val != -999 else "N/A"
            
            card_html = (
                f'<div style="background:{bg_color}; border:2px solid {border_color}; border-radius:12px; padding:1.2rem; position:relative; box-shadow:0 4px 6px rgba(0,0,0,0.1); margin-bottom:1rem; text-align:center; min-height: 120px;">'
                f'{badge}'
                f'<div style="font-size:0.8rem; color:#94a3b8; font-weight:600; text-transform:uppercase; letter-spacing:0.05rem; margin-bottom:0.5rem;">{name}</div>'
                f'<div style="font-size:1.6rem; font-weight:700; color:{text_color};">{score_text}</div>'
                f'<div style="font-size:0.75rem; color:#64748b; margin-top:0.3rem;">R² Accuracy</div>'
                f'</div>'
            )
            st.markdown(card_html, unsafe_allow_html=True)

    # Highlight winner in a nice success alert box
    st.markdown("---")
    st.success(f"🏆 **Winner:** **{best_model_name}** performed the best for this stock, achieving a **{round(best_score * 100, 2)}%** confidence score ($R^2$). Showing prediction visualization below.")

    # Prepare chart data for the best model
    valid = df[x.shape[0]:].copy()
    valid['predictions'] = best_prediction

    data_chart = {'Close': [], 'Vclose': [], 'Vpredictions': []}
    mod = pd.DataFrame(data_chart)
    mod.index.name = 'index'
    mod.Close = df.Close
    
    start_idx = len(df) - len(best_prediction)
    mod.loc[start_idx:, 'Vpredictions'] = valid.predictions
    
    prediction_graph(best_model_name, best_score, mod) 

#############################################################################

def data_analysis():
    company = company_name()
    def data_download():
        data = yf.download(tickers=companies[company], period='180d', interval='1d', auto_adjust=False)
        if isinstance(data.columns, pd.MultiIndex):
            data.columns = data.columns.droplevel(1)

        def divide(j):
            j = j / 1000000
            return j

        data['Volume'] = data['Volume'].apply(divide)
        data.rename(columns={'Volume': 'Volume (in millions)'}, inplace=True)
        return data
    data = data_download()
    if data is None or data.empty:
        st.error("Error: Downloaded data is empty. Yahoo Finance might be blocking the request, or the ticker may be delisted.")
        return
    data.dropna(inplace=True)
    if data.empty:
        st.error("Error: All downloaded data contains NaNs or is empty.")
        return
    show = show_data()
    df1 = data

    if show == "Graphs":
        st.header('Visualization for ' + company)
        ma = st.slider('Slide to select days for Moving Average', min_value=5, max_value=100)
        df1['MA'] = df1.Close.rolling(ma).mean()

        fig = go.Figure(data=[go.Candlestick(x=df1.index,
                                     open=df1['Open'],
                                     high=df1['High'],
                                     low=df1['Low'],
                                     close=df1['Close'],
                                     name='Market Data'),
                      go.Scatter(x=list(df1.index), y=list(df1.MA), line=dict(color='blue', width=2), name='Moving Average')])

        fig.update_layout(
            title='Live share price evolution',
            yaxis_title='Stock Price (USD per shares)', height=550)

        fig.update_xaxes(rangeslider_visible=True,
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
        st.plotly_chart(fig, use_container_width=True)

        # ma = st.slider('Slide to select days for Moving Average', min_value=5, max_value=100)
        # df1 = yf.download(tickers=companies[company], period='1460d', interval='1d')
        # df1['MA'] = df1.Close.rolling(ma).mean()
        # fig0 = go.Figure()
        # fig0.add_trace(go.Scatter(x=list(df1.index), y=list(df1.MA)))
        # fig0.update_layout(title_text="Volume of the stock in millions")
        # fig0.update_xaxes(rangeslider_visible=True)
        # st.plotly_chart(fig0)

        st.markdown("### Volume of the stocks")
        st.markdown("Trading volume is a measure of how much of a given financial asset has traded in a period of "
                    "time. For stocks, volume is measured in the number of shares traded and, for futures and options, "
                    "it is based on how many contracts have changed hands.")

        # fig1 = go.Figure()
        # fig1.add_trace(go.Scatter(x=list(data.index), y=list(data['Volume (in millions)'])))

        fig1 = go.Figure([go.Bar(x=data.index, y=data['Volume (in millions)'])])
        fig1.update_layout(title_text="Volume of the stock in millions", height=550)
        fig1.update_xaxes(rangeslider_visible=True,
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

        st.plotly_chart(fig1, use_container_width=True)
        st.markdown("### Opening prices of the stock")
        st.markdown("The opening price is the price at which a security first trades upon the opening of an exchange "
                    "on a trading day; for example, the National Stock Exchange (NSE) opens at precisely 9:00 a.m. "
                    "Eastern time. The price of the first trade for any listed stock is its daily opening price. The "
                    "opening price is an important marker for that day's trading activity, particularly for those "
                    "interested in measuring short-term results such as day traders.")

        fig2 = go.Figure()
        fig2.add_trace(go.Scatter(x=list(data.index), y=list(data.Open)))
        fig2.update_layout(title_text="Opening price of the stock", height=550)
        fig2.update_xaxes(rangeslider_visible=True,
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

        st.plotly_chart(fig2, use_container_width=True)

        st.markdown("### High price for the stock")
        st.markdown("Today's high refers to a company's intraday high trading price. Today's high is the highest "
                    "price at which a stock traded during the course of the trading day. Today's high is typically "
                    "higher than the closing or opening price. More often than not this is higher than the closing "
                    "price.")

        fig3 = go.Figure()
        fig3.add_trace(go.Scatter(x=list(data.index), y=list(data.High)))
        fig3.update_layout(title_text="High price of the stock", height=550)
        fig3.update_xaxes(rangeslider_visible=True,
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

        st.plotly_chart(fig3, use_container_width=True)

        st.markdown("### Lowest price for the stock")
        st.markdown("Today’s low is a security's intraday low trading price. Today's low is the lowest price at which a"
                    " stock trades over the course of a trading day. Today's low is typically lower than the opening or"
                    " closing price, as it is unusual that the lowest price of the day would happen to occur at those "
                    "particular moments.")

        fig4 = go.Figure()
        fig4.add_trace(go.Scatter(x=list(data.index), y=list(data.Low)))
        fig4.update_layout(title_text="Low price of the stock", height=550)
        fig4.update_xaxes(rangeslider_visible=True,
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

        st.plotly_chart(fig4, use_container_width=True)

        st.markdown("### Closing price of the stock")
        st.markdown("The closing price of a stock is the price at which the share closes at the end of trading hours "
                    "of the stock market. In simple terms, the closing price is the weighted average of all prices "
                    "during the last 30 minutes of the trading hours.")

        fig5 = go.Figure()
        fig5.add_trace(go.Scatter(x=list(data.index), y=list(data.Close)))
        fig5.update_layout(title_text="Closing price of the stock", height=550)
        fig5.update_xaxes(rangeslider_visible=True,
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

        st.plotly_chart(fig5, use_container_width=True)

######################################################################################

    elif show == "Company Data":
        symbolticker = companies[company]
        dataticker = yf.Ticker(symbolticker)
        st.header('Information of company ' + company)
        st.markdown("### Stock Price Data")
        st.dataframe(data)
        st.markdown("### International Securities Identification Number")
        st.markdown(dataticker.isin)
        # st.markdown("### Sustainability")
        st.dataframe(dataticker.sustainability)
        st.markdown("### Major Holders")
        st.dataframe(dataticker.major_holders)
        st.markdown("### Institutional Holders")
        st.dataframe(dataticker.institutional_holders)
        st.markdown("### Calendar")
        st.dataframe(dataticker.calendar)
        st.markdown("### Recommendations")
        st.dataframe(dataticker.recommendations)

###################################################################################

def prediction():
    scaler = MinMaxScaler(feature_range=(0, 1))
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
    if df is None or df.empty:
        st.error("Error: Downloaded data is empty. Yahoo Finance might be blocking the request, or the ticker may be delisted.")
        return
    df.dropna(inplace=True)
    if df.empty:
        st.error("Error: All downloaded data contains NaNs or is empty.")
        return
    
    pred = st.sidebar.radio("Regression Type", [ "Linear Regression", "SVR Prediction",
                                                "RBF Prediction","Tree Prediction","LSTM"])

    # removing index which is date
    df['Date'] = df.index
    df.reset_index(drop=True, inplace=True)

    # rearranging the columns
    df = df[['Date', 'Open', 'High', 'Low', 'Close', 'Adj Close', 'Volume (in millions)']]
    df['Close'] = scaler.fit_transform(df[['Close']])
    df = df[['Close']]

    # create a variable to predict 'x' days out into the future
    future_days = 50
    if len(df) <= future_days:
        st.error(f"Error: Not enough data points (only {len(df)} available) to predict {future_days} days into the future. Need at least {future_days + 10} days of data.")
        return
        
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
        #mod.Vclose = df.Close.loc[:747]
        #mod.Vpredictions = df.Close.loc[150:201]
        #mod.Vclose.loc[148:] = valid.Close
        mod.loc[valid.index, 'Vpredictions'] = valid.predictions
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

        # mod.Vclose = df.Close.loc[:747]
        # mod.Vpredictions = df.Close.loc[:747]

        # mod.Vclose.loc[148:] = valid.Close
        mod.loc[valid.index, 'Vpredictions'] = valid.predictions
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

        # mod.Vclose = df.Close.loc[:747]
        # mod.Vpredictions = df.Close.loc[:747]

        # mod.Vclose.loc[148:] = valid.Close
        mod.loc[valid.index, 'Vpredictions'] = valid.predictions
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

        # mod.Vclose = df.Close.loc[:747]
        # mod.Vpredictions = df.Close.loc[:747]

        # mod.Vclose.loc[148:] = valid.Close
        mod.loc[valid.index, 'Vpredictions'] = valid.predictions
        # mod.Close = df.Close.loc[:150]
        chart_data = mod
        rbf_confidence = rbf_svr.score(x_test, y_test)
        prediction_graph(pred, rbf_confidence, chart_data)

  

    elif pred == "LSTM":
        if HAS_LSTM:
            data = df[['Close']]
            
            scaler = MinMaxScaler(feature_range=(0, 1))
            scaled_data = scaler.fit_transform(df[['Close']])

            # Load the data
            data = scaled_data.reshape(-1, 1)

            # Split the data into training and testing sets
            train_size = int(len(data) * 0.75)
            train_data = data[:train_size]
            test_data = data[train_size:]

            # Define the number of previous days to use for prediction
            n_days = 40

            # Create the feature and target datasets for training
            X_train, y_train = [], []
            for i in range(n_days, len(train_data)):
                X_train.append(train_data[i - n_days:i, 0])
                y_train.append(train_data[i, 0])
            X_train, y_train = np.array(X_train), np.array(y_train)
            X_train = np.reshape(X_train, (X_train.shape[0], X_train.shape[1], 1))

            # Create the feature dataset for testing
            inputs = data[len(data) - len(test_data) - n_days:]
            X_test = []
            for i in range(n_days, len(inputs)):
                X_test.append(inputs[i - n_days:i, 0])
            X_test = np.array(X_test)
            X_test = np.reshape(X_test, (X_test.shape[0], X_test.shape[1], 1))

            # Train and evaluate using PyTorch
            X_train_t = torch.FloatTensor(X_train)
            y_train_t = torch.FloatTensor(y_train).unsqueeze(1)
            X_test_t = torch.FloatTensor(X_test)
            test_data_t = torch.FloatTensor(test_data)

            device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
            model = PyTorchLSTM().to(device)
            criterion = nn.MSELoss()
            optimizer = optim.Adam(model.parameters(), lr=0.001)

            dataset = torch.utils.data.TensorDataset(X_train_t, y_train_t)
            loader = torch.utils.data.DataLoader(dataset, batch_size=32, shuffle=True)

            model.train()
            for epoch in range(10):
                for batch_x, batch_y in loader:
                    batch_x, batch_y = batch_x.to(device), batch_y.to(device)
                    optimizer.zero_grad()
                    outputs = model(batch_x)
                    loss = criterion(outputs, batch_y)
                    loss.backward()
                    optimizer.step()

            model.eval()
            with torch.no_grad():
                predictions_t = model(X_test_t.to(device))
                test_loss_val = criterion(predictions_t, test_data_t.to(device)).item()
                predictions = predictions_t.cpu().numpy()
                predictions = scaler.inverse_transform(predictions)
                test_loss = test_loss_val

            data = {'Close': [], 'Vclose': [], 'Vpredictions': []}
            mod = pd.DataFrame(data)
            mod.index.name = 'index'
            mod.Close = df.Close
            pred1 = []
            for da in predictions:
                pred1.append(da[0])
            
            mod.loc[df.index[-len(pred1):], 'Vpredictions'] = pred1
            chart_data = mod
            prediction_graph(pred, test_loss, chart_data)
        else:
            st.warning("LSTM prediction is disabled because PyTorch is not installed or not supported on this Python version.")


      



##################################################################################

if __name__ == "__main__":
    main()
