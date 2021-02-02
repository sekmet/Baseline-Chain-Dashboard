import Swal from 'sweetalert2';

export function Alert(icon, title, message, buttonText) {

    Swal.fire({
        title: title,
        text: message,
        icon: icon,
        confirmButtonText: buttonText ? buttonText : 'Ok'
      });

}