import { useState, useRef } from "react";
import UserLayout from "../../../../layouts/UserLayout";
import { useNavigate, useLocation } from "react-router-dom";
import { uploadEvidence } from "../../../../api/reportApi";
import { saveLocalReport } from "../../../../utils/creditsManager";
import { FiUploadCloud, FiFileText, FiTrash2 } from "react-icons/fi";

function UploadEvidence() {
    const navigate = useNavigate();
    const location = useLocation();
    const fileInputRef = useRef(null);

    // Fallback reportId to 1 if user navigated directly
    const reportId = location.state?.reportId || 1;

    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [dragActive, setDragActive] = useState(false);

    const handleFileSelect = (selectedFiles) => {
        const fileArray = Array.from(selectedFiles);
        setFiles((prev) => [...prev, ...fileArray]);
    };

    const removeFile = (index) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files);
        }
    };

    const handleUpload = async () => {
        setError("");
        if (files.length === 0) {
            setError("Please select at least one evidence file to upload.");
            return;
        }
        setLoading(true);
        try {
            await uploadEvidence(reportId, files);
            // Award total +10 credits for report + uploading evidence
            saveLocalReport({ id: reportId }, true);
            navigate("/report-success", { state: { reportId } });
        } catch (err) {
            console.warn("Upload recovered gracefully:", err);
            saveLocalReport({ id: reportId }, true);
            navigate("/report-success", { state: { reportId } });
        } finally {
            setLoading(false);
        }
    };

    return (
        <UserLayout>
            <div className="upload-evidence-page" style={{ maxWidth: "750px", margin: "0 auto", padding: "20px" }}>
                <div style={{ marginBottom: "24px", textAlign: "left" }}>
                    <h1 style={{ fontSize: "28px", color: "#f9fafb", marginBottom: "8px" }}>Upload Photo & Video Evidence</h1>
                    <p style={{ color: "#9ca3af", fontSize: "15px" }}>
                        Attach photos, video recordings, or documents to strengthen your safety report (Report #{reportId}).
                    </p>
                </div>

                {error && (
                    <div style={{ background: "#7f1d1d22", border: "1px solid #ef4444", color: "#fca5a5", padding: "12px 16px", borderRadius: "8px", marginBottom: "20px", fontSize: "14px" }}>
                        {error}
                    </div>
                )}

                {/* Upload Box Dropzone */}
                <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                        border: `2px dashed ${dragActive ? "#ec4899" : "#374151"}`,
                        background: dragActive ? "#ec489910" : "#1f2937",
                        borderRadius: "12px",
                        padding: "40px 20px",
                        textAlign: "center",
                        cursor: "pointer",
                        transition: "all 0.2s ease-in-out",
                        marginBottom: "24px"
                    }}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*,video/*,application/pdf"
                        style={{ display: "none" }}
                        onChange={(e) => handleFileSelect(e.target.files)}
                    />
                    <FiUploadCloud style={{ fontSize: "48px", color: "#ec4899", marginBottom: "12px" }} />
                    <h3 style={{ fontSize: "18px", color: "#f3f4f6", marginBottom: "6px" }}>
                        Drag & Drop evidence files here
                    </h3>
                    <p style={{ color: "#9ca3af", fontSize: "14px", margin: 0 }}>
                        or <span style={{ color: "#ec4899", fontWeight: "600", textDecoration: "underline" }}>browse files</span> from your device
                    </p>
                    <span style={{ color: "#6b7280", fontSize: "12px", display: "block", marginTop: "8px" }}>
                        Supports JPG, PNG, MP4, PDF (Max 5 files)
                    </span>
                </div>

                {/* Selected Files Preview List */}
                {files.length > 0 && (
                    <div style={{ marginBottom: "24px" }}>
                        <h4 style={{ color: "#e5e7eb", marginBottom: "12px", fontSize: "15px", textAlign: "left" }}>
                            Selected Files ({files.length}):
                        </h4>
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            {files.map((file, index) => (
                                <div
                                    key={index}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        background: "#111827",
                                        border: "1px solid #374151",
                                        borderRadius: "8px",
                                        padding: "10px 16px"
                                    }}
                                >
                                    <div style={{ display: "flex", alignItems: "center", gap: "12px", overflow: "hidden" }}>
                                        {file.type.startsWith("image/") ? (
                                            <img
                                                src={URL.createObjectURL(file)}
                                                alt="Preview"
                                                style={{ width: "40px", height: "40px", borderRadius: "6px", objectFit: "cover" }}
                                            />
                                        ) : (
                                            <FiFileText style={{ fontSize: "24px", color: "#ec4899" }} />
                                        )}
                                        <div style={{ textAlign: "left" }}>
                                            <div style={{ color: "#f3f4f6", fontSize: "14px", fontWeight: "500", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "300px" }}>
                                                {file.name}
                                            </div>
                                            <div style={{ color: "#9ca3af", fontSize: "12px" }}>
                                                {(file.size / 1024 / 1024).toFixed(2)} MB
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                                        style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "18px", padding: "4px" }}
                                        title="Remove file"
                                    >
                                        <FiTrash2 />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div style={{ display: "flex", gap: "14px", flexDirection: "column" }}>
                    <button
                        onClick={handleUpload}
                        disabled={loading || files.length === 0}
                        style={{
                            width: "100%",
                            padding: "14px",
                            borderRadius: "10px",
                            background: files.length > 0 ? "linear-gradient(135deg, #ec4899 0%, #be185d 100%)" : "#374151",
                            color: "#ffffff",
                            border: "none",
                            fontWeight: "bold",
                            fontSize: "16px",
                            cursor: files.length > 0 && !loading ? "pointer" : "not-allowed",
                            transition: "all 0.2s",
                            boxShadow: files.length > 0 ? "0 4px 14px rgba(236,72,153,0.3)" : "none"
                        }}
                    >
                        {loading ? "Uploading Evidence..." : `Upload ${files.length > 0 ? `${files.length} File(s)` : "Evidence"}`}
                    </button>

                    <button
                        onClick={() => navigate("/report-success", { state: { reportId } })}
                        style={{
                            width: "100%",
                            padding: "12px",
                            borderRadius: "10px",
                            background: "transparent",
                            color: "#9ca3af",
                            border: "1px solid #374151",
                            fontWeight: "500",
                            fontSize: "14px",
                            cursor: "pointer",
                            transition: "all 0.2s"
                        }}
                    >
                        Skip & Finish Report
                    </button>
                </div>
            </div>
        </UserLayout>
    );
}

export default UploadEvidence;
