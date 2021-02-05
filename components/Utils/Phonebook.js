import Swal from 'sweetalert2';
import axios from "axios";

export function addPhonebook() {
//icon, title, message, buttonText
    Swal.fire({
        title: 'New Phonebook Entry',
        input: 'text',
        inputAttributes: {
          autocapitalize: 'off'
        },
        showCancelButton: true,
        confirmButtonText: 'Verify and Save',
        showLoaderOnConfirm: true,
        preConfirm: async (newEntry) => {
          /*return fetch(`http://api.baseline.test/send-commit`)
            .then(response => {
              if (!response.ok) {
                throw new Error(response.statusText)
              }
              return response.json()
            })
            .catch(error => {
              Swal.showValidationMessage(
                `Request failed: ${error}`
              )
            })*/
  
            return await axios.post('http://api.baseline.test/add-phonebook', {
                domain: newEntry
              })
              .then((response) => {
                  //access the resp here....
                  console.log(`Status New Phonebook : ${response.data}`);
                  //Alert('success', 'Contracts Deployed...', `Contracts deployed with success into ${network} network..`);
                  return response.data;
              })
              .catch((error) => {
                  console.log(error);
                  Swal.showValidationMessage(
                    `Request failed: ${error}`
                  )
              });
            
            

        },
        allowOutsideClick: () => !Swal.isLoading()
      }).then((result) => {
        if (result.domain) {
          Swal.fire({
            icon: 'success',
            title: `New  phonebook entry saved with success...`,
            message: `Domain: ${result.domain}`
            //imageUrl: result.value.avatar_url
          })
        }
      })

}