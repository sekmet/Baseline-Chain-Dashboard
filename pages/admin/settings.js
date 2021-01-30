import React from "react";

// components

import FormSettings from "components/Forms/FormSettings.js";

// layout for page

import Admin from "layouts/Admin.js";

import commitMgrConfig from '../../configs/commit_mgr.config';

// This function gets called at build time
export async function getStaticProps() {
  // By returning { props: { posts } }, the Blog component
  // will receive `posts` as a prop at build time
  return {
    props: { ...commitMgrConfig },
  }
}

export default function Settings(props) {
  return (
    <>
      <div className="flex flex-wrap">
        <div className="w-full lg:w-12/12 px-4">
          <FormSettings {...props} />
        </div>
      </div>
    </>
  );
}

Settings.layout = Admin;
