import React from "react";
import TreeMerkle from '../Utils/TreeData';
// components

export default function CardTree({ title }) {

  const treeTitle = title ? title : "[DB] Merkle Tree";

  return (
    <>
      <div className="relative flex flex-col min-w-0 break-words bg-white w-full mb-6 shadow-lg rounded">
        <div className="rounded-t mb-0 px-3 py-3 border-0">
          <div className="flex flex-wrap items-justify">
            <div className="relative w-full px-1 max-w-full flex-grow flex-1">
              <h3 className="font-semibold text-base text-gray-800">
                {treeTitle}
              </h3>
            </div>
            <div className="relative px-1 max-w-full flex-grow flex-1 text-right">
              <button
                className="bg-green-500 text-white active:bg-green-600 text-xs font-bold uppercase px-3 py-1 rounded outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
                type="button"
              >
                New Commit
              </button>
            </div>
            <div className="relative px-1 max-w-full flex-grow flex-1 text-right">
              <button
                className="bg-blue-500 text-white active:bg-indigo-600 text-xs font-bold uppercase px-3 py-1 rounded outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
                type="button"
              >
                Update
              </button>
            </div>
          </div>
        </div>
        <div className="block w-full overflow-x-auto">
          {/* Projects table */}
          <div className="items-center w-full bg-transparent" style={{ height: "296px"}}>
          <hr className="mb-1 border-b-1 border-gray-400" />
              <TreeMerkle />
          </div>
        </div>
      </div>
    </>
  );
}
