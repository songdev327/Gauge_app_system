import { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";

import ModalEditDetail from "../modals/ModalEditDetail";
import config from "../../config";
import Select from "react-select";

import SearchIcon from '@mui/icons-material/Search';

import RotateLeftIcon from '@mui/icons-material/RotateLeft';
import ImportContactsIcon from '@mui/icons-material/ImportContacts';
import TemplatePro from "../../home/TemplatePro";
import InsertPhotoIcon from '@mui/icons-material/InsertPhoto';

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";

function GaugeImageList() {
    const [productImages, setProductImages] = useState([]);
    const [gaugeName, setGaugeName] = useState('');
    const [remark, setRemark] = useState('');
    const [imageName, setImageName] = useState('');
    const [imgUrl, setImgUrl] = useState('');

    const [selectedItem, setSelectedItem] = useState(null);
    const [allProductImages, setAllProductImages] = useState([]);
    const [totalCount, setTotalCount] = useState(0);

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
                <div className="content-wrapper">

                    <h3 className="fw-bold mb-4"> <InsertPhotoIcon id="icon-list" />
                        GAUGE IMAGES LIST ALL
                    </h3>

                    <div className="col-3 mt-4">
                        <button
                            type="button"
                            data-toggle="modal"
                            data-target="#modalShowProductImage"
                            className="btn btn-success col-12" id="open-image"
                        >
                            <ImportContactsIcon className="mr-2" />
                            OPEN ALL IMAGES
                        </button>
                    </div>

                    <div className="row">
                        <div className="mt-3 col-3 ml-2">
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
                                <th className="text-white text-center">Gauge Name</th>
                                <th className="text-white text-center">Remark</th>
                                <th className="text-white text-center">Images</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedImages.length > 0
                                ? paginatedImages.map((item) => (
                                    <tr key={item.id}> {/* เพิ่ม `key` ที่ไม่ซ้ำกันที่นี่ */}
                                        {/* <td className="text-center">{item.id}</td> */}
                                        <td className="text-center">{item.gaugeName}</td>
                                        <td className="text-center">{item.remark}</td>

                                        <td className="text-center">
                                            <button
                                                onClick={() => handleEditClick(item)}
                                                data-toggle="modal"
                                                data-target="#modalProductImageUpdate"
                                                type="button"
                                                className="btn btn-success mr-3"
                                            >
                                                <ImportContactsIcon className="mr-1" />  Image
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
                    <div className="row">
                        <input
                            style={{ textAlign: "center", fontSize: "1.5rem" }}
                            value={gaugeName}
                            className="form-control text-primary fw-bold" disabled
                        />
                    </div>
                    <div className="row">
                        <div className="col-7 ml-2">
                            {imgUrl ? (
                                <img
                                    src={imgUrl}
                                    alt="Gauge"
                                    style={{
                                        width: "100%",
                                        height: "31.25rem",
                                        objectFit: "contain",
                                        borderRadius: "10px",
                                    }}
                                />
                            ) : (
                                <p>No Image available</p>
                            )}
                        </div>
                    </div>
                </div>

            </ModalEditDetail>

        </>
    )
}
export default GaugeImageList;