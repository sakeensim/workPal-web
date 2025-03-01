import Swal from "sweetalert2";

export const createAlert = (icon,text) => {
    return Swal.fire({
    icon: icon || 'info',
    text: text || 'Something wrong',
    timer: 2000,
  });
}