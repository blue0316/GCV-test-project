import React, { useRef, useState, useEffect } from "react";
import Modal from 'react-modal';
import "./App.css";

const customStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    minWidth: '480px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContentCenter: 'center',
  },
};

Modal.setAppElement('#root');

function App() {
  const fileInputRef = useRef();
  const [image, setImage] = useState();
  const [preview, setPreview] = useState();

  const [faceAnno, setFaceAnno] = useState([]);
  const [labelAnno, setLabelAnno] = useState([]);
  const [safeSearchAnno, setSafeSearchAnno] = useState({
    adult: "Not_Detected",
    medical: "Not_Detected",
    racy: "Not_Detected",
    spoof: "Not_Detected",
    violence: "Not_Detected",
  });

  const [imageStatus, setImageStatus] = useState({
    multiFaces: true,
    noFrontFace: true,
    detectWeapon: true,
    detectBlurry: true,
    nudeCheck: true
  });
  // const [webDetectionAnno, setWebDetectionAnno] = useState([]);

  const [loading, setLoading] = useState(false);

  // Variable and status for modal.
  let subtitle;
  const [modalIsOpen, setIsOpen] = useState(false);

  const googleCloud = {
    apiKey: "AIzaSyAzbqOaEsx9nQTfM3LU_acJmTWpdIsxQkM",
    api: "https://vision.googleapis.com/v1/images:annotate?key=",
  };

  useEffect(() => {
    if (image) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result.toString());
      };
      reader.readAsDataURL(image);
    } else {
      setPreview(null);
    }
  }, [image]);

  const imageDetection = (data) => {
    let tmp = {
      multiFaces: true,
      noFrontFace: true,
      detectWeapon: true,
      detectBlurry: true,
      nudeCheck: true
    };

    let dataFaceAnno = data.faceAnnotations ? data.faceAnnotations : [];
    let dataLabelAnno = data.labelAnnotations ? data.labelAnnotations : [];
    let dataSafeSearchAnno = data.safeSearchAnnotation ? data.safeSearchAnnotation : {
      adult: "VERY_UNLIKELY",
      medical: "VERY_UNLIKELY",
      racy: "VERY_UNLIKELY",
      spoof: "VERY_UNLIKELY",
      violence: "VERY_UNLIKELY",
    }
    // Multiple Face Detection
    if (dataFaceAnno.length !== 1) {
      tmp.multiFaces = false;
    }

    let labelAnnoStr = "";
    dataLabelAnno.forEach(label => (labelAnnoStr += (label.description.toLowerCase() + " ")));

    // Not Front Face Detection
    const facePartials = [
      'chin',
      'eye',
      'nose',
      'mouse',
      'lip',
      'cheek'
    ];
    console.log(labelAnnoStr)
    for (let i=0; i < facePartials.length; i++) {
      if (tmp.noFrontFace && labelAnnoStr.includes(facePartials[i])) {
        console.log(facePartials[i])
        break;
      }
      if (i + 1 === facePartials.length) tmp.noFrontFace = false;
    }

    // Weapon Detection
    if (labelAnnoStr.includes("gun") || labelAnnoStr.includes("knife")) tmp.detectWeapon = false;

    // Blurry Face Detection
    dataFaceAnno.forEach(face => {
      if (face.blurredLikelihood !== "VERY_UNLIKELY" && face.blurredLikelihood !== "UNLIKELY" && tmp.detectBlurry) {
        tmp.detectBlurry = false;
      }
    });

    // Adult Image Check
    if ((dataSafeSearchAnno.adult !== "VERY_UNLIKELY" && data.safeSearchAnnotation.adult !== "UNLIKELY") && tmp.nudeCheck) {
      tmp.nudeCheck = false;
    }

    console.log(tmp)
    setImageStatus(tmp);

    openModal();
  }

  async function callGoogleVIsionApi(base64) {
    setLoading(true);
    let url = googleCloud.api + googleCloud.apiKey;
    await fetch(url, {
      method: "POST",
      body: JSON.stringify({
        requests: [
          {
            image: {
              content: base64.replace(
                /^data:image\/(png|jpg|jpeg);base64,/,
                ""
              ),
            },
            features: [
              { type: "FACE_DETECTION", maxResults: 10 },
              { type: "LABEL_DETECTION", maxResults: 20 },
              { type: "SAFE_SEARCH_DETECTION", maxResults: 10 },
              { type: "WEB_DETECTION", maxResults: 10 },
            ],
            imageContext: {
              faceRecognitionParams: {
                celebritySet: ["builtin/default"]
              },
            }
          },
        ],
      }),
    }).then((res) => res.json())
      .then((data) => {
        setFaceAnno(
          data.responses[0].faceAnnotations
            ? data.responses[0].faceAnnotations
            : []
        );
        setLabelAnno(
          data.responses[0].labelAnnotations
            ? data.responses[0].labelAnnotations
            : []
        );
        setSafeSearchAnno(
          data.responses[0].safeSearchAnnotation
            ? data.responses[0].safeSearchAnnotation
            : {
                adult: "Not_Detected",
                medical: "Not_Detected",
                racy: "Not_Detected",
                spoof: "Not_Detected",
                violence: "Not_Detected",
              }
        );
        // setWebDetectionAnno(data.responses[0].webDetection ? data.responses[0].webDetection : []);
        imageDetection(data.responses[0]);

        setLoading(false);
      })
      .catch((err) => {
        setLoading(false);
        console.log("Error");
        console.log("error : ", err);
      });
  }

  const openModal = () => {
    setIsOpen(true);
  }

  const afterOpenModal = () => {
    // references are now sync'd and can be accessed.
    subtitle.style.color = '#f00';
  }

  const closeModal = () => {
    setIsOpen(false);
  }

  return (
    <main className="main">
      <div className="container">
        <div className="header">
          <h1>Image Recognition</h1>
        </div>
        <div className="main">
          <div className="main-content">
            <div className="button-wrapper">
              <button
                onClick={(event) => {
                  event.preventDefault();
                  fileInputRef.current.click();
                }}
              >
                Add Image
              </button>
              <button
                onClick={() => {
                  callGoogleVIsionApi(preview);
                }}
              >
                vision annotate
              </button>
            </div>

            <figure className="image-review-wrapper">
              {preview ? (
                <img
                  src={preview}
                  alt={"preview"}
                  style={{ objectFit: "cover" }}
                  height={540}
                  width={540}
                />
              ) : (
                <p>No image selected.</p>
              )}
            </figure>

            <div className="safe-status">
              <h2 className="section-title">Safe Search Detection Result</h2>
              <div className="safe-status-item">
                <p className={`status-${safeSearchAnno.adult.toLowerCase()}`}>
                  Adult: <span>{safeSearchAnno.adult}</span>
                </p>
              </div>
              <div className="safe-status-item">
                <p className={`status-${safeSearchAnno.medical.toLowerCase()}`}>
                  Medical: <span>{safeSearchAnno.medical}</span>
                </p>
              </div>
              <div className="safe-status-item">
                <p className={`status-${safeSearchAnno.racy.toLowerCase()}`}>
                  Racy: <span>{safeSearchAnno.racy}</span>
                </p>
              </div>
              <div className="safe-status-item">
                <p className={`status-${safeSearchAnno.spoof.toLowerCase()}`}>
                  Spoof: <span>{safeSearchAnno.spoof}</span>
                </p>
              </div>
              <div className="safe-status-item">
                <p
                  className={`status-${safeSearchAnno.violence.toLowerCase()}`}
                >
                  Violence: <span>{safeSearchAnno.violence}</span>
                </p>
              </div>
            </div>

            <input
              type="file"
              style={{ display: "none" }}
              ref={fileInputRef}
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files[0];
                if (file && file.type.substr(0, 5) === "image") {
                  setImage(file);
                } else {
                  setImage(null);
                }
              }}
            />
          </div>
          <aside className="sidebar">
            <div
              className={
                faceAnno.length === 1 ? "available-image" : "unavailable-image"
              }
            >
              Face Detection:{" "}
              <span>
                {faceAnno.length > 0
                  ? faceAnno.length > 1
                    ? faceAnno.length + " Faces"
                    : faceAnno.length + " Face"
                  : "No face"}
              </span>
            </div>
            <div>
              {faceAnno.length > 0 ? (
                faceAnno.map((face, index) => (
                  <div key={`face-${index}`}>
                    <h4>Face {index + 1}</h4>
                    <p
                      className={`status-${face.angerLikelihood.toLowerCase()}`}
                    >
                      Anger: <span>{face.angerLikelihood}</span>
                    </p>
                    <p
                      className={`status-${face.blurredLikelihood.toLowerCase()}`}
                    >
                      Blurred: <span>{face.blurredLikelihood}</span>
                    </p>
                    <p
                      className={`status-${face.headwearLikelihood.toLowerCase()}`}
                    >
                      Headwear: <span>{face.headwearLikelihood}</span>
                    </p>
                    <p
                      className={`status-${face.joyLikelihood.toLowerCase()}`}
                    >
                      Joy: <span>{face.joyLikelihood}</span>
                    </p>
                    <p
                      className={`status-${face.sorrowLikelihood.toLowerCase()}`}
                    >
                      Sorrow: <span>{face.sorrowLikelihood}</span>
                    </p>
                    <p
                      className={`status-${face.surpriseLikelihood.toLowerCase()}`}
                    >
                      Surprise: <span>{face.surpriseLikelihood}</span>
                    </p>
                  </div>
                ))
              ) : (
                <></>
              )}
            </div>
            <div>
              <h3>Labels</h3>
              {labelAnno.length > 0 ? (
                <p className="label-wrapper">
                  {labelAnno.map((label, index) => (
                    <span className={`label-${index}`}>
                      {index + 1 < labelAnno.length ? (
                        <>{label.description},&nbsp;</>
                      ) : (
                        <>{label.description}</>
                      )}
                    </span>
                  ))}
                </p>
              ) : (
                <p>No label.</p>
              )}
            </div>
          </aside>
        </div>
        {loading ? (
          <div className="loading-overlay">
            <h2>Loading...</h2>
          </div>
        ) : (
          <></>
        )}
      </div>
      <Modal
        isOpen={modalIsOpen}
        onAfterOpen={afterOpenModal}
        onRequestClose={closeModal}
        style={customStyles}
        contentLabel="Example Modal"
      >
        <h2 ref={(_subtitle) => (subtitle = _subtitle)}>Image Detection Result</h2>
        <button onClick={closeModal}>close</button>
        <div>
          <ul className="status-list">
            <li className={`status-${imageStatus.multiFaces.toString()}`}>Face Detection: <span>{ imageStatus.multiFaces ? 'true' : 'false' }</span></li>
            <li className={`status-${imageStatus.noFrontFace.toString()}`}>Not Front Face Detection: <span>{ imageStatus.noFrontFace ? 'true' : 'false' }</span></li>
            <li className={`status-${imageStatus.detectWeapon.toString()}`}>Weapon Detection: <span>{ imageStatus.detectWeapon ? 'true' : 'false' }</span></li>
            <li className={`status-${imageStatus.detectBlurry.toString()}`}>Blurry Image Detection: <span>{ imageStatus.detectBlurry ? 'true' : 'false' }</span></li>
            <li className={`status-${imageStatus.nudeCheck.toString()}`}>Nude Image Detection: <span>{ imageStatus.nudeCheck ? 'true' : 'false' }</span></li>
          </ul>
          <h2 className={`total-result status-${imageStatus.multiFaces && imageStatus.noFrontFace && imageStatus.detectWeapon && imageStatus.detectBlurry && imageStatus.nudeCheck.toString()}`}>Result: <span>{ imageStatus.multiFaces && imageStatus.noFrontFace && imageStatus.detectWeapon && imageStatus.detectBlurry && imageStatus.nudeCheck  ? 'true' : 'false' }</span></h2>
        </div>
      </Modal>
    </main>
  );
}

export default App;
