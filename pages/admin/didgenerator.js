import React from "react";

// components

import CardDidGenerator from "components/Cards/CardDidGenerator.js";
// layout for page

import Admin from "layouts/Admin.js";

export default function Didgenerator() {
  return (
    <>
      <div className="flex flex-wrap">
        <div className="w-full lg:w-12/12 px-4">
          <CardDidGenerator />
        </div>
      </div>
    </>
  );
}

Didgenerator.layout = Admin;
