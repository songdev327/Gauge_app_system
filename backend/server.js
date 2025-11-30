const express = require('express');
const cors = require('cors');
const conn = require('./connect');   
const app = express();
const port = 3006;



//-------------- Start Update data base ----------------------------------------------------

// const fs = require('fs'); // Update data base
// const path = require('path'); // Update data base
// const MasterIndex = require('./models/DetailModel'); // Update data base

//-------------- End Update data base --------------------------------------------------------------



//---- Start ใช้สำหรับ Run Build ---------------------------------------------------

// const path = require("path");

//---- End ใช้สำหรับ Run Build ---------------------------------------------------

app.use(cors());


//---- Start ใช้สำหรับ Run Build ---------------------------------------------------

// const corsOptions = {
//   origin: [
//     'http://localhost:3006',           // local dev
//     'http://10.120.123.25:3006',       // IP ที่คุณต้องการอนุญาต
//     'http://192.168.96.124:3006'       // ปัจจุบันที่คุณใช้
//   ],
//   credentials: true
// };
// app.use(cors(corsOptions));

//---- End ใช้สำหรับ Run Build ---------------------------------------------------

app.use(express.json());

//---- Start ใช้สำหรับ Run Build ---------------------------------------------------

// app.use(express.static(path.join(__dirname, "../frontend/build")));

//---- End ใช้สำหรับ Run Build ---------------------------------------------------



require('./models/UserModel');  
require('./models/GaugeRequestModel');  
require("./models/MasterIndexModel"); // ✅ เพิ่ม model
require("./models/DetailModel"); // ✅ เพิ่ม model
require("./models/BorrowGaugeDetailModel"); 
require("./models/PartNameModel"); 
require("./models/ModelMasterModel"); 
require("./models/ProcessModel"); 
// require("./models/MasterIndexExcelModel"); 

// ---- Auth ----
const Auth = require('./controllers/AuthController'); // ✅ ได้เป็นฟังก์ชัน (app)

app.use('/auth', Auth);    



app.use('/users', require('./controllers/UserController')); 
app.use("/", require("./controllers/GaugeRequestController"));
app.use(require("./controllers/MasterIndexController"));
app.use(require("./controllers/DetailController"));
app.use(require("./controllers/BorrowGaugeDetailController"));
app.use(require("./controllers/PartNameController"));
app.use(require("./controllers/ModelMasterController"));
app.use(require("./controllers/ProcessController"));

app.use(require("./controllers/MasterIndexExcelController"));
app.use(require("./controllers/DetailExcelController"));




//-------------- Start Update data base --------------------------------------------------------------

// // อ่านข้อมูลจากไฟล์ JSON และเพิ่มข้อมูลเข้าสู่ฐานข้อมูล // Update data base
// const loadDetailData = async () => {
//   try {
//     const data = fs.readFileSync(path.join(__dirname, 'data', 'Detail_pretty.json'), 'utf-8');
//     const detailData = JSON.parse(data);

//     for (const part of detailData) {
//       await MasterIndex.create(part);
//     }
//     console.log('✅ Spare parts data loaded successfully');
//   } catch (err) {
//     console.error('❌ Error loading spare parts data:', err);
//   }
// };

// loadDetailData();

//-------------- End Update data base ---------------------------------------------------


(async () => {
  try {
    await conn.authenticate();
    console.log('✅ DB connected');

    // ใช้ alter ตอนพัฒนา ถ้า schema นิ่งแล้วเปลี่ยนเป็น false
    await conn.sync({ alter: true });
    console.log('✅ DB synced');


//------- Start Run Builde fallback all unmatched routes to React index.html


// app.get(/.*/, (req, res) => {
//   res.sendFile(path.join(__dirname, "../frontend/build/index.html"));
// });

// app.listen(port, '0.0.0.0', () => {
//   console.log(`✅ Server is running on http://0.0.0.0:${port}`);
// });

//------- End Run Builde fallback all unmatched routes to React index.html

    app.listen(port, () => {
      console.log(`🚀 Server listening on http://localhost:${port}`);
    });


  } catch (err) {
    console.error('❌ DB error:', err);
    process.exit(1);
  }
})();
