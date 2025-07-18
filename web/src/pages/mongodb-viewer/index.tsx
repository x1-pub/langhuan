import React from "react";

import ViewerTabs from "@/components/viewer-tabs";
import Viewer from './viewer'

const MongodbViewer: React.FC = () => {
  return <ViewerTabs><Viewer /></ViewerTabs>
}

export default MongodbViewer