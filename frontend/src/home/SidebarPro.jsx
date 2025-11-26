
import { Link } from 'react-router-dom';
import ReorderIcon from '@mui/icons-material/Reorder';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ListAltIcon from '@mui/icons-material/ListAlt';


function SidebarPro() {
  
  return (
    <aside className="main-sidebar sidebar-white elevation-4">
      <a href=" " className="brand-link" id="sidebar-mm-link">
        <span className="brand-text fw-bold">GAUGE CONTROL SYSTEM</span>
      </a>

     <div class="sidebar" id="sidebar-mm">
                    <nav class="mt-2">
                        <ul
                            class="nav nav-pills nav-sidebar flex-column"
                            data-widget="treeview"
                            role="menu"
                            data-accordion="false"
                        >
                            <li class="nav-item mt-2">
                                <Link to="/dashboardProduct" class="nav-link">
                                    <DashboardIcon className='text-black fw-bold' style={{ fontSize: "2rem" }} />
                                    <p className="text-black fw-bold ml-1" style={{ fontSize: "1rem" }}>DASHBOARD</p>
                                </Link>
                            </li>
                            <li class="nav-item mt-3">
                                <Link to="/mainMenu" class="nav-link">
                                    <ReorderIcon className='text-black fw-bold' style={{ fontSize: "2rem" }} />
                                    <p className="text-black fw-bold ml-1" style={{ fontSize: "1rem" }}>MAIN MENU</p>
                                </Link>
                            </li>
                            <li class="nav-item mt-3">
                                <Link to="/gaugeListPageRequest" class="nav-link">
                                    <ListAltIcon className='text-black fw-bold' style={{ fontSize: "2rem" }} />
                                    <p className="text-black fw-bold ml-1" style={{ fontSize: "1rem" }}>LIST REQUEST</p>
                                </Link>
                            </li>
                            <li class="nav-item"></li>
                        </ul>
                    </nav>
                </div>
    </aside>
  );
}

export default SidebarPro;
