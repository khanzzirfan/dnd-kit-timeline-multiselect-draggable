import React from "react";
import { Button } from "@/components/ui/button";
import {
  ExternalLinkIcon,
  GitHubLogoIcon,
  RotateCounterClockwiseIcon,
} from "@radix-ui/react-icons";

import Timeline from "./components/timeline/timeline";
import TimelineWrapper from "./components/timeline/timeline-wrapper";

function App() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 mt-10">
      <TimelineWrapper>
        <Timeline />
      </TimelineWrapper>
    </div>
  );
}

export default App;
