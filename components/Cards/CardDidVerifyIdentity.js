import React from "react";

export default function CardDidVerifyIdentity(props) {

  return (
    <>
      <div className="relative flex flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded-lg bg-gray-200 border-0">
        <div className="rounded-t bg-white mb-0 px-6 py-6">
          <div className="text-center flex justify-between">
            <h6 className="text-gray-800 text-xl font-bold">DID Verify Identity</h6>
            <button
              className="bg-gray-800 active:bg-green-700 text-white font-bold uppercase text-xs px-4 py-2 rounded shadow hover:shadow-md outline-none focus:outline-none mr-1 ease-linear transition-all duration-150"
              type="button"
              onClick={() => props.didgen()}
            >
              Verify a DID Identity
            </button>
          </div>
        </div>
        <div className="flex-auto px-4 lg:px-10 py-10 pt-0">
          <form>
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
                    className="px-3 py-3 placeholder-gray-400 text-gray-700 bg-white rounded text-sm shadow focus:outline-none focus:shadow-outline w-full ease-linear transition-all duration-150"
                />
                </div>
            </div>

            {/*<div className="w-full lg:w-12/12 px-4">
                <div className="relative w-full mb-3">
                <label
                    className="block uppercase text-gray-700 text-xs font-bold mb-2"
                    htmlFor="grid-password"
                >
                    DID Identity
                </label>
                <textarea
                    type="text"
                    className="px-3 py-3 placeholder-gray-400 text-gray-700 bg-white rounded text-sm shadow focus:outline-none focus:shadow-outline w-full ease-linear transition-all duration-150"
                    rows="9"
                    defaultValue={`{"@context": "https://identity.foundation/.well-known/contexts/did-configuration-v0.0.jsonld", "linked_dids": ["eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NksifQ.eyJ2YyI6eyJjcmVkZW50aWFsU3ViamVjdCI6eyJvcmlnaW4iOiJ0YWlsd2luZHBvd2VyLm5ldGxpZnkuYXBwIn0sIkBjb250ZXh0IjpbImh0dHBzOi8vd3d3LnczLm9yZy8yMDE4L2NyZWRlbnRpYWxzL3YxIiwiaHR0cHM6Ly9pZGVudGl0eS5mb3VuZGF0aW9uLy53ZWxsLWtub3duL2NvbnRleHRzL2RpZC1jb25maWd1cmF0aW9uLXYwLjAuanNvbmxkIl0sInR5cGUiOlsiVmVyaWZpYWJsZUNyZWRlbnRpYWwiLCJEb21haW5MaW5rYWdlQ3JlZGVudGlhbCJdfSwic3ViIjoiZGlkOmV0aHI6Z29lcmxpOjB4NDBkOWMzYWU2ODhhNmY0MGRmMzgyY2VmNzU1ZjU5OTFhNTQ4OWE2OSIsIm5iZiI6MTYxMTc3ODcyOSwiaXNzIjoiZGlkOmV0aHI6Z29lcmxpOjB4NDBkOWMzYWU2ODhhNmY0MGRmMzgyY2VmNzU1ZjU5OTFhNTQ4OWE2OSJ9.bpuXYwptwCrje3D1c1dBc8jsIcsVJaj5pUlPp1r_hP2cggbxhKcH0tvRXnaRn8d8WgDKQ3iOW2adv2Q0vsxttw"] }`}
                ></textarea>
                </div>
  </div>*/}
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
