
import React from "react";
import TemplatePro from '../../home/TemplatePro';
import Swal from "sweetalert2";
import "./manu.css"
import ReorderIcon from '@mui/icons-material/Reorder';

import { useNavigate } from "react-router-dom";

export default function MainMenu() {

  const navigate = useNavigate();
  const handleClick = async (label) => {
    const result = await Swal.fire({
      title: "คุณแน่ใจหรือไม่?",
      html: `คุณกดปุ่ม: <b>${label}</b>`,
      icon: "question",
      showCancelButton: true, // ✅ แสดงปุ่มยกเลิก
      cancelButtonText: "ยกเลิก",
      confirmButtonText: "ตกลง",
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",

    });

    if (result.isConfirmed) {
      Swal.fire({
        title: "ยืนยันแล้ว!",
        text: `คุณเลือก: ${label}`,
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });

      navigate('/gaugeRequestForm')

    } else {
      Swal.fire({
        title: "ยกเลิกแล้ว",
        text: "ไม่ได้ดำเนินการใด ๆ",
        icon: "info",
        timer: 1200,
        showConfirmButton: false,
      });
    }
  };


  return (
    <TemplatePro>
      <>
        <div className="content-wrapper">
          <div className="signup_container d-flex justify-content-center">
           <div className="signup_form w-50">
          <div className="menu-box">
            <h2 className="menu-title"><ReorderIcon className="mr-2" id="icon-list"/>MAIN MENU</h2>

            <button
              className="mainmenu-btn"
              onClick={() => handleClick("ยืม Gauge")}
            >
              ยืม Gauge
            </button>
          </div>
         </div>
         </div>
        </div>


      </>

    </TemplatePro>


  );
}
