
import { useState } from "react";
import UserLayout from "../../../layouts/UserLayout";
import { useNavigate } from "react-router-dom";
import BackButton from "../../../common/BackButton/BackButton";

import {
  FiSend
} from "react-icons/fi";

import { submitSupportQuery } from "../../../api/supportApi";

function Support() {

  const navigate = useNavigate();

  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("General Support");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");
    if (!subject.trim() || !message.trim()) {
      setError("Please fill in a subject and a message.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await submitSupportQuery({
        subject: subject.trim(),
        category: category,
        message: message.trim(),
      });
      navigate("/query-submitted", { state: { ticketId: res?.ticketId } });
    } catch (err) {
      setError(err?.response?.data?.message || "Could not submit your query. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (

    <UserLayout>
<BackButton />
      <div className="support-page">

        <div className="support-header">

          <h1>Support</h1>

        </div>

        <div className="support-card">

          <h2>Need Help?</h2>

          <p>
            We are here to help you.<br/>
            Send us your question or issue.
          </p>

          {error && (
            <p style={{ color: "#ff4d4f" }}>{error}</p>
          )}

          <label>Subject</label>

          <input
            type="text"
            placeholder="Enter subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />

          <label>Category</label>

          <select value={category} onChange={(e) => setCategory(e.target.value)}>

            <option>General Support</option>

            <option>Technical Issue</option>

            <option>Emergency</option>

            <option>Feedback</option>

          </select>

          <label>Describe your Issue</label>

          <textarea
            rows="6"
            placeholder="Type your message here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          ></textarea>

          <button className="submit-btn" onClick={handleSubmit} disabled={submitting}>

            <FiSend />

            {submitting ? "Submitting..." : "Submit Query"}

          </button>

        </div>

      </div>

    </UserLayout>

  );

}

export default Support;
