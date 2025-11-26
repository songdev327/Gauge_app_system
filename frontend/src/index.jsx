import ReactDOM from 'react-dom/client';
import reportWebVitals from './reportWebVitals';

import {createBrowserRouter,RouterProvider,} from "react-router-dom";
import Home from './home/Home';


import Dashboard from './pages/dashboard/Dashboard';
import Settings from './pages/settings/Settings';
import HomeSetting from './home/HomeSetting';
import UserManage from './pages/settings/UserManage';
import MainMenu from './pages/mainmenu/MainMenu';
import RequestGaugeForm from './pages/mainmenu/GaugeRequestForm';
import GaugeList from './pages/mainmenu/GaugeListPageRequest';
import Detail from './pages/settings/Detail';
import MasterIndexPage from './pages/settings/MasterIndex';
import PartName from './pages/settings/PartName';
import ModelMaster from './pages/settings/ModelMaster';
import BorrowGaugeDetail from './pages/settings/BorrowGaugeDetail';
import Process from './pages/settings/Process';
import MasterIndexDashboard from './pages/settings/MasterIndexDashboard';


const router = createBrowserRouter([

  {path: "/", element: <Home />},
  {path: "/homeSetting", element: <HomeSetting />},

  {path: "/dashboardProduct", element: <Dashboard />},
  
  {path: "/settings", element: <Settings />},
  {path: "/userManage", element: <UserManage />},
  {path: "/detailGauge", element: <Detail />},
  {path: "/masterIndex", element: <MasterIndexPage />},
  {path: "/detail", element: <Detail />},
  {path: "/partName", element: <PartName />},
  {path: "/modelMaster", element: <ModelMaster />},
  {path: "/processMaster", element: <Process />},
  {path: "/borrowGaugeDetail", element: <BorrowGaugeDetail />},
  {path: "/MasterIndexDashboard", element: <MasterIndexDashboard />},
 

  {path: "/mainMenu", element: <MainMenu />},
  {path: "/gaugeRequestForm", element: <RequestGaugeForm />},
  {path: "/gaugeListPageRequest", element: <GaugeList />},
 

  ]);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <RouterProvider router={router} />
);

reportWebVitals();