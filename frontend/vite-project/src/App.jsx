import React, { useState, useEffect } from "react";
import axios from "axios";

function DocumentManager() {
  const [files, setFiles] = useState([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  // Reset index on page load
  useEffect(() => {
    const resetIndex = async () => {
      try {
        await axios.post("http://localhost:5000/reset-index");
        console.log("Index reset on page reload");
      } catch (err) {
        console.error("Error resetting index:", err);
      }
    };
    resetIndex();
  }, []);

  const handleUpload = async () => {
    if (!files || files.length === 0) return alert("Please select files!");

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
    }

    try {
      await axios.post("http://localhost:5000/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("Files uploaded and indexed!");
      setFiles([]);
    } catch (err) {
      if (err.response && err.response.status === 400) {
        alert(err.response.data);
      } else {
        alert("Error uploading files");
      }
    }
  };

  const handleSearch = async () => {
    if (!query) return alert("Please enter a search query!");

    try {
      const res = await axios.get(
        `http://localhost:5000/search?q=${encodeURIComponent(query)}`
      );
      setResults(res.data);
    } catch (err) {
      console.error(err);
      alert("Error searching documents");
    }
  };

  return (
    <div className="min-h-screen w-screen bg-violet-400 text-white flex flex-col items-center p-6">
      <h2 className="text-2xl font-bold mb-6">📄 Document Upload & Search</h2>

      {/* Upload */}
      <div className="bg-gray-800 p-4 rounded-lg shadow-lg w-full max-w-lg mb-6">
        <input
          type="file"
          multiple
          onChange={(e) => setFiles(e.target.files)}
          className="block w-full text-sm text-gray-300 border border-gray-600 rounded-lg cursor-pointer bg-gray-700 focus:outline-none"
        />
        <button
          onClick={handleUpload}
          className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg"
        >
          Upload
        </button>
      </div>

      {/* Search */}
      <div className="bg-gray-800 p-4 rounded-lg shadow-lg w-full max-w-lg mb-6 flex">
        <input
          type="text"
          value={query}
          placeholder="Search documents..."
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 p-2 rounded-l-lg bg-gray-700 text-white focus:outline-none"
        />
        <button
          onClick={handleSearch}
          className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-r-lg font-semibold"
        >
          Search
        </button>
      </div>

      {/* Results */}
      <div className="w-full max-w-lg space-y-4">
        {results.map((doc, idx) => (
          <div
            key={idx}
            className="bg-gray-800 p-4 rounded-lg shadow-md"
          >
            <h4 className="font-bold text-yellow-400">{doc.filename}</h4>
            <p
              dangerouslySetInnerHTML={{ __html: doc.highlight }}
              className="mt-2 bg-gray-700 p-2 rounded"
            ></p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default DocumentManager;
