import Swal from "sweetalert2";

// ✅ Base config (matches modern dark UI)
const base = {
  background: "#111827", // dark
  color: "#f9fafb",
  confirmButtonColor: "#6366f1", // indigo
  cancelButtonColor: "#6b7280",
};

// ✅ Success Alert
export const successAlert = (text: string) =>
  Swal.fire({
    ...base,
    icon: "success",
    title: "Success",
    text,
    timer: 1500,
    showConfirmButton: false,
  });

// ❌ Error Alert
export const errorAlert = (text: string) =>
  Swal.fire({
    ...base,
    icon: "error",
    title: "Error",
    text,
  });

// ⚠️ Confirm Delete
export const confirmDelete = (text?: string) =>
  Swal.fire({
    ...base,
    icon: "warning",
    title: "Are you sure?",
    text: text || "This action cannot be undone",
    showCancelButton: true,
    confirmButtonText: "Yes, delete it",
  });
