import React, { useState } from "react";
import { CheckCircle, XCircle, Download, FileText } from "lucide-react";
import JSZip from "jszip";

function App() {
  const [files, setFiles] = useState([]);
  const [converted, setConverted] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [quality, setQuality] = useState(80);
  const [width, setWidth] = useState();
  const [height, setHeight] = useState();
  const [error, setError] = useState(""); // Error message state

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length + files.length > 20) {
      setError("You can only upload up to 20 files.");
      return;
    }
    setFiles((prevFiles) => [...prevFiles, ...selectedFiles]);
  };

  const handleConvert = async () => {
    if (!files.length) return;

    // Validation for quality, width, and height
    if (quality > 100) {
      setError("Quality cannot be greater than 100");
      return;
    }
    if (width > 5000 || height > 5000) {
      setError("Width and height cannot be greater than 5000");
      return;
    }
    setError(""); // Reset error if inputs are valid

    const formData = new FormData();
    files.forEach((file) => formData.append("images", file));
    formData.append("quality", quality);
    formData.append("width", width);
    formData.append("height", height);

    setIsLoading(true);

    try {
      const res = await fetch(
        `https://webp-convertor-backend.onrender.com/upload?width=${width}&height=${height}&quality=${quality}`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();

      if (res.ok && data.urls) {
        const results = data.urls.map((url, i) => ({
          name: files[i].name,
          status: "Converted",
          url,
        }));
        setConverted(results);
      } else {
        alert(data.error || "Conversion failed");
      }
    } catch (error) {
      console.error(error);
      alert("Failed to upload or convert images");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (index) => {
    const updated = [...converted];
    updated.splice(index, 1);
    setConverted(updated);
  };

  const handleQualityChange = (e) => {
    const value = e.target.value;
    if (value > 100) {
      setError("Quality cannot be greater than 100");
    } else {
      setError("");
    }
    setQuality(value);
  };

  const handleWidthChange = (e) => {
    const value = e.target.value;
    if (value > 5000) {
      setError("Width cannot be greater than 5000");
    } else {
      setError("");
    }
    setWidth(value);
  };

  const handleHeightChange = (e) => {
    const value = e.target.value;
    if (value > 5000) {
      setError("Height cannot be greater than 5000");
    } else {
      setError("");
    }
    setHeight(value);
  };

  // const handleZipDownload = async () => {
  //   const zip = new JSZip();
  //   const folder = zip.folder("converted_images");

  //   console.log("Ertrtr", converted);

  //   converted?.forEach((file, i) => {
  //     fetch(file.url)
  //       .then((res) => res.blob())
  //       .then((blob) => {
  //         folder.file(file.name, blob);
  //       });
  //   });

  //   zip.generateAsync({ type: "blob" }).then(function (content) {
  //     const a = document.createElement("a");
  //     a.href = URL.createObjectURL(content);
  //     a.download = "converted_images.zip";
  //     a.click();
  //   });
  // };
  // const handleZipDownload = async () => {
  //   const zip = new JSZip();
  //   const folder = zip.folder("converted_images");

  //   console.log("Ertrtr", converted);

  //   // Use a map to handle all fetch requests and wait for all to finish
  //   const fetchPromises = converted?.map((file) =>
  //     fetch(file.url)
  //       .then((res) => res.blob())
  //       .then((blob) => {
  //         folder.file(file.name, blob);
  //       })
  //   );

  //   // Wait for all fetch requests to complete
  //   await Promise.all(fetchPromises);

  //   // Once all files are added, generate and download the zip
  //   zip.generateAsync({ type: "blob" }).then(function (content) {
  //     const a = document.createElement("a");
  //     a.href = URL.createObjectURL(content);
  //     a.download = "converted_images.zip";
  //     a.click();
  //   });
  // };

  const handleZipDownload = async () => {
    const zip = new JSZip();
    const folder = zip.folder("converted_images");

    console.log("Converted files:", converted);

    // Create an array of promises to handle the fetch and conversion asynchronously
    const fetchPromises = converted?.map(async (file) => {
      try {
        const res = await fetch(file.url);
        if (!res.ok) throw new Error(`Failed to fetch ${file.url}`);
        const blob = await res.blob();
        const img = await createImageBitmap(blob);

        // Create a canvas element to convert the image to WebP
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        // Set canvas size to the image's width and height
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw the image onto the canvas
        ctx.drawImage(img, 0, 0);

        // Convert the image to WebP format using canvas.toDataURL()
        const webpBlob = await new Promise((resolve) => {
          canvas.toBlob(resolve, "image/webp");
        });

        // Add the converted WebP image to the zip
        const fileName = file.name.endsWith(".webp")
          ? file.name
          : `${file.name.split(".")[0]}.webp`;
        folder.file(fileName, webpBlob);
      } catch (error) {
        console.error("Error processing file:", file.name, error);
      }
    });

    // Wait for all fetch promises to complete
    await Promise.all(fetchPromises);

    // Generate the zip file and trigger the download
    zip.generateAsync({ type: "blob" }).then(function (content) {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(content);
      a.download = "converted_images.zip";
      a.click();
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 px-4 py-10 text-white font-sans">
      <div className="max-w-6xl mx-auto rounded-3xl shadow-2xl overflow-hidden bg-white text-gray-800 flex flex-col md:flex-row">
        {/* LEFT - Upload section */}
        <div className="w-full md:w-1/2 p-8 bg-white">
          <h2 className="text-2xl font-bold text-indigo-600 mb-6">
            Convert your images to WebP
          </h2>
          <div className="space-y-6">
            {/* Step 1 */}
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 flex items-center justify-center bg-orange-500 text-white font-bold rounded-full">
                1
              </div>
              <div className="flex-1">
                <label className="font-medium">Select file to convert</label>
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="block w-full mt-2 border rounded px-3 py-2"
                  accept="image/*"
                  disabled={files.length >= 20} // Disable input if 20 files are selected
                />
                {files.length >= 20 && (
                  <p className="text-red-500 mt-2">
                    You can only upload up to 20 files.
                  </p>
                )}
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 flex items-center justify-center bg-orange-500 text-white font-bold rounded-full">
                2
              </div>
              <div className="flex-1">
                <label className="font-medium">Select format</label>
                <input
                  type="text"
                  value="webp"
                  disabled
                  className="block w-full mt-2 border rounded px-3 py-2 bg-gray-100 text-gray-600"
                />
              </div>
            </div>

            {/* Step 3 - Quality, Width, and Height Inputs */}
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 flex items-center justify-center bg-orange-500 text-white font-bold rounded-full">
                3
              </div>
              <div className="flex-1">
                <label className="font-medium">Quality (1-100)</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={quality}
                  onChange={handleQualityChange} // Validation on change
                  className="block w-full mt-2 border rounded px-3 py-2"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 flex items-center justify-center bg-orange-500 text-white font-bold rounded-full">
                4
              </div>
              <div className="flex-1">
                <label className="font-medium">Width (Max 5000)</label>
                <input
                  type="number"
                  min="1"
                  max="5000"
                  value={width}
                  onChange={handleWidthChange} // Validation on change
                  className="block w-full mt-2 border rounded px-3 py-2"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 flex items-center justify-center bg-orange-500 text-white font-bold rounded-full">
                5
              </div>
              <div className="flex-1">
                <label className="font-medium">Height (Max 5000)</label>
                <input
                  type="number"
                  min="1"
                  max="5000"
                  value={height}
                  onChange={handleHeightChange} // Validation on change
                  className="block w-full mt-2 border rounded px-3 py-2"
                />
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 flex items-center justify-center bg-orange-500 text-white font-bold rounded-full">
                6
              </div>
              <button
                onClick={handleConvert}
                disabled={isLoading || error} // Disable button if there is an error
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2 rounded"
              >
                {isLoading ? "Converting..." : "Convert"}
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT - Converted files list */}
        <div className="w-full md:w-1/2 bg-white p-8 border-l border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-indigo-600">
            All done! Download your converted files now
          </h2>
          {error && <p className="text-red-500">{error}</p>}{" "}
          {/* Error message display */}
          <div className="space-y-3">
            {converted.map((file, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-gray-50 border rounded-lg px-4 py-3"
              >
                <span className="text-gray-700 truncate">{file.name}</span>
                <div className="flex items-center gap-3">
                  <span className="flex items-center text-green-600 font-medium">
                    <CheckCircle className="w-5 h-5 mr-1" /> {file.status}
                  </span>
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className="text-orange-500 hover:text-orange-600"
                  >
                    <Download className="w-5 h-5" />
                  </a>

                  <button
                    onClick={() => handleDelete(i)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
            {converted.length === 0 && (
              <p className="text-gray-500">No files converted yet.</p>
            )}
            {converted.length > 0 && (
              <button
                onClick={handleZipDownload}
                className="mt-4 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
              >
                <FileText className="w-5 h-5 inline mr-2" />
                Download All as Zip
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
