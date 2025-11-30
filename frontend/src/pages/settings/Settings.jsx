// import Template from "../../home/Template";
import { Link } from "react-router-dom";
import SettingsIcon from "@mui/icons-material/Settings";
import ReorderIcon from '@mui/icons-material/Reorder';
import PersonIcon from '@mui/icons-material/Person';
import './setting.css'
import TemplatePro from "../../home/TemplatePro"


function Settings() {


  return (
    <>
      <TemplatePro>
        <div className="signup_container d-flex justify-content-center">
          {/* <div className="register-box"> */}
          <div className="signup_form w-50 mb-5">
            <div className="card card-outline card-success mt-1" id="card-setting">
              <div className="card-header text-center" id="">
                <h3 className="h2">
                  <SettingsIcon className="mb-2 fw-bold" id="setting" />
                  <b className="ml-3">SETTING</b>
                  <span className="ml-3"></span>
                </h3>
              </div>
              <div className="card-body" id="">
                <form>
                  <div className="row g-3">
                    <div className="col-md-4">
                      <Link to="/userManage">
                        <button className="btn btn-success w-100">
                          <PersonIcon className="mr-1"/>
                          USER
                        </button>
                      </Link>
                    </div>

                    <div className="col-md-4">
                      <Link to="/masterIndex">
                        <button className="btn btn-success w-100">
                          <ReorderIcon className="mr-1"/>
                           INDEX
                        </button>
                      </Link>
                    </div>

                    <div className="col-md-4">
                      <Link to="/detail">
                        <button className="btn btn-success w-100">
                          <ReorderIcon className="mr-1"/>
                          DETAIL
                        </button>
                      </Link>
                    </div>

                    <div className="col-md-4 mt-3">
                      <Link to="/partName">
                        <button className="btn btn-success w-100">
                          <ReorderIcon className="mr-1"/>
                          PART NAME
                        </button>
                      </Link>
                    </div>

                    <div className="col-md-4 mt-3">
                      <Link to="/modelMaster">
                        <button className="btn btn-success w-100">
                          <ReorderIcon className="mr-1"/>
                          MODEL
                        </button>
                      </Link>
                    </div>
                    <div className="col-md-4 mt-3">
                      <Link to="/processMaster">
                        <button className="btn btn-success w-100">
                          <ReorderIcon className="mr-1"/>
                          SECTION
                        </button>
                      </Link>
                    </div>
                    <div className="col-md-4 mt-3">
                      <Link to="/borrowGaugeDetail">
                        <button className="btn btn-primary w-100">
                          <ReorderIcon className="mr-1"/>
                          BORROW GAUGE
                        </button>
                      </Link>
                    </div>
                    {/* <div className="col-md-4 mt-3">
                      <Link to="/importExcel">
                        <button className="btn btn-primary w-100">
                          <ReorderIcon className="mr-1"/>
                          IMPORT EXCEL
                        </button>
                      </Link>
                    </div> */}
                  </div>

                </form>
              </div>
            </div>
          </div>
        </div>
      </TemplatePro>
    </>
  );
}
export default Settings;
