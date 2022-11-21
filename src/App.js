import React, { useRef, useState, useEffect } from "react";
import logo from "./logo.svg";
import "./App.css";

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
  // const [webDetectionAnno, setWebDetectionAnno] = useState([]);

  const [loading, setLoading] = useState(false);

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

  const googleCloud = {
    apiKey: "AIzaSyAzbqOaEsx9nQTfM3LU_acJmTWpdIsxQkM",
    api: "https://vision.googleapis.com/v1/images:annotate?key=",
  };

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
              { type: "LABEL_DETECTION", maxResults: 10 },
              { type: "SAFE_SEARCH_DETECTION", maxResults: 10 },
              { type: "WEB_DETECTION", maxResults: 10 },
            ],
          },
        ],
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("Response");
        console.log(data);
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

        setLoading(false);
      })
      .catch((err) => {
        setLoading(false);
        console.log("Error");
        console.log("error : ", err);
      });
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
                  console.log(preview);
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
                      className={`status-${faceAnno[0].angerLikelihood.toLowerCase()}`}
                    >
                      Anger: <span>{faceAnno[0].angerLikelihood}</span>
                    </p>
                    <p
                      className={`status-${faceAnno[0].blurredLikelihood.toLowerCase()}`}
                    >
                      Blurred: <span>{faceAnno[0].blurredLikelihood}</span>
                    </p>
                    <p
                      className={`status-${faceAnno[0].headwearLikelihood.toLowerCase()}`}
                    >
                      Headwear: <span>{faceAnno[0].headwearLikelihood}</span>
                    </p>
                    <p
                      className={`status-${faceAnno[0].joyLikelihood.toLowerCase()}`}
                    >
                      Joy: <span>{faceAnno[0].joyLikelihood}</span>
                    </p>
                    <p
                      className={`status-${faceAnno[0].sorrowLikelihood.toLowerCase()}`}
                    >
                      Sorrow: <span>{faceAnno[0].sorrowLikelihood}</span>
                    </p>
                    <p
                      className={`status-${faceAnno[0].surpriseLikelihood.toLowerCase()}`}
                    >
                      Surprise: <span>{faceAnno[0].surpriseLikelihood}</span>
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
    </main>
  );
}

export default App;
