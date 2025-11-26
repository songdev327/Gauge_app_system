
import './index.css'
function Modal(props) {

    let modalSize = 'modal-dialog';

    if (props.modalSize) {
        modalSize += ' ' + props.modalSize;
    }

    const  closeModal = () => {
        window.location.reload() 
    }

    return(
        <>
            <div className="modal" id={props.id} tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
                <div className={modalSize}>
                    <div className="modal-content">
                        <div className="modal-header">
                            <h1 className="modal-title" id="exampleModalLabel">{props.title}</h1>
                            <button onClick={closeModal} type="button" className="btn-close btn-close-large" data-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div className="modal-body">
                            {props.children}
                        </div>
                    </div>
                </div>
            </div>

        </>
    )
}

export default Modal;