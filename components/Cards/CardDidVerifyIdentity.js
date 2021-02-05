import React from "react";
import axios from "axios";
import { Alert } from "../Utils/Alert";

function CheckIsValidDomain(domain) { 
  var re = new RegExp(/^((?:(?:(?:\w[\.\-\+]?)*)\w)+)((?:(?:(?:\w[\.\-\+]?){0,62})\w)+)\.(\w{2,6})$/); 
  return domain.match(re);
} 

export default class CardDidVerifyIdentity extends React.Component {

  //const wallet = useWallet();  
  constructor(props) {
    super(props);
  
    this.state = {
      useActive: false,
      domainname: '',
      hasError: false,
      errorMessage: '',
      canSubmit: false,
      resultJson: false,
      isVerifying: false,
      didIdentity: false
    }
  
    }
  
   onChange = (e) => {
        //console.log(`${e.target.name} = ${e.target.value}`);
        this.setState({[e.target.name]: e.target.value});
        if (e.target.value.length >= 3) {
          this.setState({useActive: true});
        } else {
          this.setState({hasError: false, errorMessage: '', useActive: false, canSubmit: false, resultJson: false});
        }
  
    }
  
    onSubmit = async (e) => {
      e.preventDefault();
      // get our form data out of state
      if (CheckIsValidDomain(this.state.domainname)){
        this.setState({canSubmit: true});
        this.setState({canSubmit: true, hasError: false, errorMessage: '', isVerifying: true});
  
        return await axios.post('http://api.baseline.test/did-verify', { domain: this.state.domainname } )
          .then((response) => {
              //access the resp here....
              var payload = response.data;
              console.log(`DID identity Verified: ${JSON.stringify(payload, undefined, 2)}`);
              this.setState({
                  canSubmit: false,
                  resultJson: JSON.stringify(payload, undefined, 2),
                  domain: "",
                  didIdentity: payload.dids[0],
                  hasError: false,
                  isVerifying: false
              });
  
              Alert('success', 'DID Identity Verified...', 'DID identity verified with success...');
          })
          .catch((error) => {
              console.log(error);
              this.setState({
                  hasError: true,
                  resultJson: false,
                  isVerifying: false,
                  errorMessage: "Failed to download the .well-known DID",
              });
              Alert('error', 'ERROR...', "Failed to download the .well-known DID");
          });
  
      } else {
        this.setState({hasError: true, errorMessage: 'Domain is not valid!', resultJson: false});
        return false;
      }
  
    }
  
    render() {
  
    const { domainname, useActive, hasError, errorMessage, isVerifying, resultJson, didIdentity } = this.state;

    return (
      <>
      <form onSubmit={this.onSubmit}>
        <div className="relative flex flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded-lg bg-gray-200 border-0">
          <div className="rounded-t bg-white mb-0 px-6 py-6">
            <div className="text-center flex justify-between">
              <h6 className="text-gray-800 text-xl font-bold">DID Verify Identity</h6>
              <button
                className={ useActive
                  ? "bg-gray-800 active:bg-gray-700 text-white font-bold uppercase text-xs px-4 py-2 rounded shadow hover:shadow-md outline-none focus:outline-none mr-1 ease-linear transition-all duration-150"
                  : "bg-gray-200 text-white font-bold uppercase text-xs px-4 py-2 rounded mr-1"
                }
                disabled={useActive ? '' : 'disabled'}
                type="submit"
              >
                Verify a DID Identity
              </button>
            </div>
          </div>
          <div className="flex-auto px-4 lg:px-10 py-10 pt-0">
              <h6 className="text-gray-500 text-sm mt-3 mb-6 font-bold uppercase">
              Verify a DID Identity for a domain name
              </h6>
              <div className="flex flex-wrap">
              <div className="w-full lg:w-12/12 px-4">
                  <div className="relative w-full mb-3">
                  <label
                      className="block uppercase text-gray-700 text-xs font-bold mb-2"
                      htmlFor="grid-password"
                  >
                      Domain Name (ex. domain.com)
                  </label>
                  <input
                      name="domainname" 
                      type="text"
                      name="domainname"
                      value={domainname}
                      onChange={this.onChange}
                      className="px-3 py-3 placeholder-gray-400 text-gray-700 bg-white rounded text-sm shadow focus:outline-none focus:shadow-outline w-full ease-linear transition-all duration-150"
                  />
                  <span className="px-3 py-3 text-red-500 text-md mt-2 font-bold">{hasError ? errorMessage : ''}</span>
                  </div>
              </div>
              {isVerifying ? <h3>Verifying DID Identity...please wait</h3>: ''}
              {resultJson ? <div className="w-full lg:w-12/12 px-4">
                  <div className="relative w-full mb-3">
                  <label
                      className="block uppercase text-gray-700 text-xs font-bold mb-2"
                      htmlFor="grid-password"
                  >
                      Verified DID Identity for {domainname} 
                  </label>
                  <input
                      name="dididentity"
                      value={didIdentity}
                      disabled="disabled"
                      type="text"
                      className="px-3 py-3 placeholder-gray-400 text-green-800 mb-2 bg-white rounded text-sm shadow focus:outline-none focus:shadow-outline w-full ease-linear transition-all duration-150"
                  />
                  <textarea
                      type="text"
                      className="px-3 py-3 placeholder-gray-400 text-green-500 bg-white rounded text-sm shadow focus:outline-none focus:shadow-outline w-full ease-linear transition-all duration-150"
                      rows="9"
                      defaultValue={resultJson}
                  ></textarea>
                  </div>
              </div> : ''}
              </div>
          </div>
        </div>
        </form>
      </>
    );
}
}
