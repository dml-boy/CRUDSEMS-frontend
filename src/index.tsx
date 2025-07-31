import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Provider } from 'react-redux';
import { store } from './store';
// import { BrowserRouter } from 'react-router-dom'; // ✅ Import BrowserRouter

const container = document.getElementById('root') as HTMLElement;
const root = ReactDOM.createRoot(container);

root.render(
  <React.StrictMode>
    <Provider store={store}>
      {/* <BrowserRouter> ✅ Wrap App with BrowserRouter */}
        <App />
      {/* </BrowserRouter> */}
    </Provider>
  </React.StrictMode>
);

reportWebVitals();
