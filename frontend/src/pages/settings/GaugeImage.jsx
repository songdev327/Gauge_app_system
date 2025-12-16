import { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { Link } from "react-router-dom";
import ModalEditDetail from "../modals/ModalEditDetail";
import config from "../../config";
import Select from "react-select";
import UndoIcon from '@mui/icons-material/Undo';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import RotateLeftIcon from '@mui/icons-material/RotateLeft';
import ImportContactsIcon from '@mui/icons-material/ImportContacts';
import BackupIcon from '@mui/icons-material/Backup';
import TemplatePro from "../../home/TemplatePro";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";

function GaugeImage() {
    const [productImage, setProductImage] = useState({});
    const [productImages, setProductImages] = useState([]);
    const [gaugeName, setGaugeName] = useState('');
    const [remark, setRemark] = useState('');
    const [imageName, setImageName] = useState('');
    const [imgUrl, setImgUrl] = useState('');

    const [selectedItem, setSelectedItem] = useState(null);
    const [allProductImages, setAllProductImages] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [previewImage, setPreviewImage] = useState(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const totalPages = Math.ceil(productImages.length / pageSize);

    const paginatedImages = productImages.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );


    useEffect(() => {
        fetchDataProductImage();

    }, []);

    const handleChangeFile = (e) => {
        const selectedFile = e.target.files?.[0];

        if (!selectedFile) return;

        if (
            selectedFile.type === "image/jpeg" ||
            selectedFile.type === "image/jpg" ||
            selectedFile.type === "image/png"
        ) {
            setProductImage(selectedFile); // หรือ object ถ้าคุณต้องการ

            // ✅ สร้าง preview
            const previewUrl = URL.createObjectURL(selectedFile);
            setPreviewImage(previewUrl);

        } else {
            Swal.fire({
                icon: "warning",
                title: "ไฟล์ไม่ถูกต้อง",
                text: "กรุณาเลือกไฟล์รูปภาพ (jpg, jpeg, png)",
            });
        }
    };

    const handleUpload = () => {
        Swal.fire({
            title: "Upload Image",
            text: "โปรดยืนยันการ Up Load Image",
            icon: "question",
            showCancelButton: true,
            showConfirmButton: true,
        }).then(async (res) => {
            if (res.isConfirmed) {
                try {

                    const _config = {
                        headers: {
                            Authorization: "Bearer " + localStorage.getItem(config.token_name),
                            "Content-Type": "multipart/form-data",
                        },
                    };

                    const formData = new FormData();
                    formData.append("productImage", productImage);
                    formData.append("gaugeName", gaugeName);       // ✅ ชื่อเกจ
                    formData.append("remark", remark);


                    await axios
                        .post(config.api_path + "/productImage/insertGaugeImage", formData, _config)
                        .then((res) => {
                            if (res.data.message === "success") {
                                Swal.fire({
                                    title: "Upload Image",
                                    text: "Upload Image Ok",
                                    icon: "success",
                                    timer: 2000,
                                });
                                window.location.reload();
                                // console.log(formData);
                            }
                        })
                        .catch((err) => {
                            throw err.response.data;
                        });
                } catch (e) {
                    Swal.fire({
                        title: "Error",
                        text: e.message,
                        icon: "error",
                    });
                }
            }
        });
    };

    const fetchDataProductImage = async () => {
        try {
            const response = await axios.get(config.api_path + "/productImage/getAllGauge");

            if (response.data.message === "success") {
                setAllProductImages(response.data.results);   // ✅ ต้นฉบับ
                setProductImages(response.data.results);      // ✅ สำหรับแสดง
                setTotalCount(response.data.results.length); // ✅ นับจำนวน
            }
        } catch (e) {
            Swal.fire("Error", e.message, "error");
        }
    };

    const handleDelete = (item) => {
        console.log('Item to delete:', item);

        if (!item || !item.id) {
            Swal.fire({
                title: 'Error',
                text: 'Invalid item ID',
                icon: 'error'
            });
            return;
        }

        Swal.fire({
            title: 'ลบข้อมูล',
            text: 'ยืนยันการลบข้อมูลออกจากระบบ',
            icon: 'question',
            showCancelButton: true,
            showConfirmButton: true
        }).then(async res => {
            if (res.isConfirmed) {
                try {
                    await axios.delete(config.api_path + '/productImage/deleteGaugeImage/' + item.id).then(res => {
                        if (res.data.message === 'success') {
                            Swal.fire({
                                title: 'ลบข้อมูล',
                                text: 'ลบข้อมูลแล้ว',
                                icon: 'success',
                                timer: 2000
                            });
                            window.location.reload();
                        }
                    });
                } catch (e) {
                    Swal.fire({
                        title: 'Error',
                        text: e.message,
                        icon: 'error'
                    });
                }
            }
        });
    }

    const handleUploadUpdate = () => {
        Swal.fire({
            title: "Update Image",
            text: "โปรดยืนยันการอัปเดตข้อมูล",
            icon: "question",
            showCancelButton: true,
            showConfirmButton: true,
        }).then(async (res) => {
            if (res.isConfirmed) {
                try {
                    const _config = {
                        headers: {
                            Authorization: "Bearer " + localStorage.getItem(config.token_name),
                            "Content-Type": "multipart/form-data",
                        },
                    };

                    const formData = new FormData();

                    if (productImage) {
                        formData.append("productImage", productImage);

                    }

                    formData.append("gaugeName", gaugeName);       // ✅ ชื่อเกจ
                    formData.append("remark", remark);

                    await axios
                        .put(config.api_path + `/productImage/updateGaugeImage/${selectedItem.id}`, formData, _config)
                        .then((res) => {
                            if (res.data.message === "success") {
                                Swal.fire({
                                    title: "Update Image",
                                    text: "ข้อมูลอัปเดตเรียบร้อย",
                                    icon: "success",
                                    timer: 2000,
                                });
                                window.location.reload();
                            }
                        })
                        .catch((err) => {
                            throw err.response.data;
                        });
                } catch (e) {
                    Swal.fire({
                        title: "Error",
                        text: e.message,
                        icon: "error",
                    });
                }
            }
        });
    };

    const [searchTerm, setSearchTerm] = useState("");
    const [gaugeSearch, setGaugeSearch] = useState({ result: [] });


    useEffect(() => {
        getGaugeSearch();

    }, []);

    const handleSearch = () => {
        if (!searchTerm) {
            Swal.fire({
                title: "Error",
                text: "กรุณาเลือกข้อมูลที่ต้องการค้นหา",
                icon: "error",
            });
            return;
        }

        const filtered = allProductImages.filter(item =>
            item.gaugeName.toLowerCase() === searchTerm.toLowerCase()
        );

        if (filtered.length > 0) {
            setProductImages(filtered);
            setTotalCount(filtered.length); // ✅ อัปเดตจำนวน
        } else {
            Swal.fire({
                title: "ไม่พบข้อมูล",
                text: "ไม่พบข้อมูลที่ตรงกับการค้นหา",
                icon: "warning",
            });
        }
    };


    const handleSearchReset = () => {
        setSearchTerm("");
        setProductImages(allProductImages);
        setTotalCount(allProductImages.length);
        setCurrentPage(1);

    };
    const getGaugeSearch = async () => {
        try {
            const response = await axios.get(config.api_path + "/productImage/getAllGauge");
            setGaugeSearch(response.data);
            console.log("Machines Search Response:", response.data);
        } catch (error) {
            console.error("Error fetching machines:", error);
        }
    };

    const handleEditClick = (item) => {
        setSelectedItem(item);
        setGaugeName(item.gaugeName || "");
        setRemark(item.remark || "");

        // ✅ รีเซ็ต preview ทุกครั้งที่กด Edit
        setPreviewImage(null);

    };

    useEffect(() => {
        if (selectedItem && selectedItem.id) {
            const fetchPdfData = async () => {
                try {
                    const response = await axios.get(`${config.api_path}/productImage/getUpdateGaugeImage/${selectedItem.id}`);
                    if (response.data.message === 'success') {
                        setImageName(response.data.result.imageName);
                        setImgUrl(`${config.api_path}/uploadproduction/${response.data.result.imageName}`);
                    }
                } catch (error) {
                    Swal.fire('Error', error.message, 'error');
                }
            };
            fetchPdfData();
        }
    }, [selectedItem]);



    return (
        <>
            <TemplatePro>
                <div className="signup_container d-flex justify-content-center">
                    <div className="signup_form w-50">
                        <div className="card card-outline">
                            <div className="card-header text-center">
                                <div className="card">
                                    <div className="card-header">
                                        <h3>
                                            <b className="fw-bold">ADD GAUGE IMAGE</b>
                                        </h3>
                                    </div>
                                    <div className="card-footer">
                                        <div className="row">
                                            <div className="col-3">
                                                <button
                                                    type="button"
                                                    data-toggle="modal"
                                                    data-target="#modalProductImage"
                                                    className="btn btn-success mr-4 col-12"
                                                >
                                                    <AddIcon />
                                                    ADD IMAGE
                                                </button>
                                            </div>
                                            <div className="col-4 ml-3">
                                                <button
                                                    type="button"
                                                    data-toggle="modal"
                                                    data-target="#modalShowProductImage"
                                                    className="btn btn-primary col-12"
                                                >
                                                    <ImportContactsIcon className="mr-1" />
                                                    OPEN IMAGES
                                                </button>
                                            </div>
                                            <div className="col-3 ml-3">
                                                <Link to='/settings'>
                                                    <button
                                                        type="button"
                                                        className="btn btn-danger col-12"
                                                    >
                                                        <UndoIcon />
                                                        BACK
                                                    </button>
                                                </Link>
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="content-wrapper">
                    <div className="row">
                        <div className="mt-3 col-3">
                            <Select
                                isClearable
                                options={
                                    gaugeSearch.results?.map(item => ({
                                        value: item.gaugeName,
                                        label: item.gaugeName
                                    })) || []
                                }
                                onChange={(option) => setSearchTerm(option?.value || "")}
                            />
                        </div>

                        <div className="mt-3 col-5">
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={handleSearch}
                            >
                                <SearchIcon />
                                SEARCH
                            </button>
                            <button
                                type="button"
                                className="btn btn-danger ml-2"
                                onClick={handleSearchReset} // เชื่อมต่อฟังก์ชันค้นหา
                            >
                                RESET
                                <RotateLeftIcon />
                            </button>

                        </div>
                        <div className="mt-3 col-2">
                            <input
                                className="form-control text-center fw-bold text-primary"
                                value={`TOTAL : ${totalCount}`}
                                readOnly
                            />
                        </div>
                    </div>


                    <table className="table table-bordered table-striped border-black table-bordered-black mt-3">
                        <thead className="table-dark">
                            <tr>
                                {/* <th className="text-white text-center">No</th> */}
                                <th className="text-white text-center">Date Input</th>
                                <th className="text-white text-center">Gauge Name</th>
                                <th className="text-white text-center">Remark</th>
                                <th className="text-white text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedImages.length > 0
                                ? paginatedImages.map((item) => (
                                    <tr key={item.id}> {/* เพิ่ม `key` ที่ไม่ซ้ำกันที่นี่ */}
                                        {/* <td className="text-center">{item.id}</td> */}
                                        <td className="text-center">
                                            {item.createdAt ? new Date(item.createdAt).toLocaleString('en-GB', { hour12: false }) : "-"}
                                        </td>
                                        <td className="text-center">{item.gaugeName}</td>
                                        <td className="text-center">{item.remark}</td>

                                        <td className="text-center">
                                            <button
                                                onClick={() => handleEditClick(item)}
                                                data-toggle="modal"
                                                data-target="#modalProductImageUpdate"
                                                type="button"
                                                className="btn btn-primary mr-3"
                                            >
                                                <i className="fa fa-pencil mr-2"></i> Edit
                                            </button>
                                            <button
                                                onClick={(e) => handleDelete(item)}
                                                type="button"
                                                className="btn btn-danger"
                                            >
                                                <i className="fa fa-trash mr-2"></i>
                                                Delete
                                            </button>
                                        </td>

                                    </tr>
                                ))
                                : ""}
                        </tbody>
                    </table>

                    <div className="d-flex justify-content-between align-items-center mt-4 mb-3">
                        <div className="d-flex align-items-center">
                            <span className="ml-2 fw-bold text-primary">Show Rows / Pages:</span>
                            <select
                                className="form-select fw-bold text-primary ml-3"
                                style={{ width: "90px" }}
                                value={pageSize}
                                onChange={(e) => {
                                    setPageSize(Number(e.target.value));
                                    setCurrentPage(1); // reset page
                                }}
                            >
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                        </div>


                        <div className="d-flex align-items-center">
                            <button
                                className="btn btn-outline-primary mr-2"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                            >
                                « Previous
                            </button>

                            <span className="fw-bold text-primary">
                                Page {currentPage} To {totalPages || 1}
                            </span>

                            <button
                                className="btn btn-outline-primary ml-2"
                                disabled={currentPage === totalPages || totalPages === 0}
                                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                            >
                                Next »
                            </button>
                        </div>

                    </div>

                </div>
            </TemplatePro>

            <ModalEditDetail id="modalProductImage" title="" modalSize="modal-lg">
                <div className="border-box">
                    <div className="col-12 mb-3" id="master-img">
                        <h3 className="h3">
                            <b className="ml-3">ADD GAUGE IMAGE</b>
                        </h3>
                    </div>

                    <div className="row">
                        <div className="col-5 mt-3">
                            <div className="text-bold pl-2" id="box-2">
                                Gauge Name.
                            </div>
                            <input
                                onChange={(e) => setGaugeName(e.target.value)}
                                type="text"
                                className="form-control text-primary"
                                placeholder="Input..."
                            />
                        </div>
                        <div className="col-5 mt-3">
                            <div className="text-bold pl-2" id="box-2">
                                Remark.
                            </div>
                            <input
                                onChange={(e) => setRemark(e.target.value)}
                                type="text"
                                className="form-control text-primary"
                                placeholder="Input..."
                            />
                        </div>
                        {/* <div className="col-6 mt-3" id="box-2">
                            <div className="text-bold pl-1 ">Add Image</div>
                            <input
                                type="file"
                                accept="image/jpeg, image/jpg, image/png"
                                name="imageName"
                                className="form-control"
                                onChange={handleChangeFile}
                            />
                        </div> */}

                        <div className="col-10 mt-3" id="box-2">
                            <div className="text-bold pl-1">Add Image</div>

                            <input
                                type="file"
                                accept="image/jpeg, image/jpg, image/png"
                                name="imageName"
                                className="form-control"
                                onChange={handleChangeFile}
                            />

                            {/* 🔍 Preview */}
                            {previewImage && (
                                <div className="mt-3 text-center">
                                    <img
                                        src={previewImage}
                                        alt="Preview"
                                        style={{
                                            width: "100%",
                                            maxHeight: "300px",
                                            objectFit: "contain",
                                            borderRadius: "10px",
                                            border: "1px solid #ddd",
                                        }}
                                    />
                                </div>
                            )}
                        </div>

                    </div>
                    <div className="mt-4">
                        <button onClick={handleUpload} className="btn btn-success col-5">
                            <BackupIcon className="mr-2" />
                            Upload Image
                        </button>
                    </div>
                </div>

            </ModalEditDetail>

            <ModalEditDetail id="modalShowProductImage" title="" modalSize="modal-dialog-custom-xllx">
                <div className="col-12 mb-2" id="master-img">
                    <h3 className="h3">
                        <b className="ml-3">DETAIL GAUGE & IMAGE</b>
                    </h3>
                </div>

                <Swiper
                    modules={[Navigation]}
                    navigation
                    spaceBetween={20}
                    slidesPerView={1}
                >
                    {productImages.map((item) => (
                        <SwiperSlide key={item.imageName}>
                            <div className="text-center">
                                <h5 className="fw-bold mb-2">{item.gaugeName}</h5>
                                <img
                                    src={`${config.api_path}/uploadproduction/${item.imageName}`}
                                    alt=""
                                    style={{
                                        width: "100%",
                                        height: "31.25rem",
                                        objectFit: "contain",
                                        borderRadius: "10px",
                                    }} id="gauge-detail-img"
                                />
                            </div>
                        </SwiperSlide>
                    ))}
                </Swiper>


            </ModalEditDetail>

            <ModalEditDetail id="modalProductImageUpdate" title="" modalSize="modal-lg">
                <div className="border-box">
                    <div className="col-12 mb-3" id="master-img">
                        <h3 className="h3 mt-1">
                            <b className="ml-3">UPDATE GAUGE IMAGE</b>
                        </h3>
                    </div>
                    <div className="row">
                        <div className="col-5">
                            <div className="text-bold pl-2" id="box-2">
                                Gauge Name
                            </div>
                            <input
                                value={gaugeName}
                                onChange={(e) => setGaugeName(e.target.value)}
                                type="text"
                                className="form-control text-primary"
                            />
                        </div>
                        <div className="col-5">
                            <div className="text-bold pl-2" id="box-2">
                                Remark
                            </div>
                            <input
                                value={remark}
                                onChange={(e) => setRemark(e.target.value)}
                                type="text"
                                className="form-control text-primary"
                                placeholder="Input......"
                            />
                        </div>


                    </div>
                    <div className="row">
                        <div className="col-10 mt-3" id="box-2">
                            {(previewImage || imgUrl) ? (
                                <img
                                    src={previewImage || imgUrl}
                                    alt="Gauge"
                                    style={{
                                        width: "100%",
                                        height: "31.25rem",
                                        objectFit: "contain",
                                        borderRadius: "10px",
                                        border: previewImage ? "2px dashed #28a745" : "1px solid #a9a9a9ff",
                                    }}
                                />
                            ) : (
                                <p>No Image available</p>
                            )}
                            <input
                                type="file"
                                accept="image/jpeg, image/jpg, image/png"
                                name="imageName"
                                className="form-control mt-2"
                                onChange={handleChangeFile}
                            />
                        </div>
                    </div>
                    <div className="mt-3">
                        <button onClick={handleUploadUpdate} className="btn btn-success col-5">
                            <BackupIcon className="mr-2" />
                            Update Image  
                        </button>
                    </div>
                </div>

            </ModalEditDetail>

        </>
    )
}
export default GaugeImage;