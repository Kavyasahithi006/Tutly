"use client";

import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { CiStreamOn } from "react-icons/ci";
import { MdEventRepeat } from "react-icons/md";
import { PiTagChevronBold } from "react-icons/pi";

import { Card } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";

import { EventDetails } from "./event-details";

dayjs.extend(isBetween);

export const EventsSidebar = ({ events }: { events: any[] }) => {
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  const getStatusBadge = (startDate: string, endDate: string, type: string) => {
    const now = dayjs();
    const start = dayjs(startDate);
    const end = dayjs(endDate);

    if (type === "Holiday" || type === "Assignment") {
      return (
        <span className="ml-auto text-xs font-medium text-blue-700 bg-blue-100 px-3 py-1.5 rounded-full">
          {type}
        </span>
      );
    }
    if (now.isBetween(start, end, null, "[]")) {
      return (
        <span className="flex justify-center gap-1 ml-auto text-xs font-medium text-purple-500 bg-purple-100 px-3 py-1.5 rounded-full">
          <CiStreamOn className="text-base font-bold " /> Live
        </span>
      );
    }
    if (end.isBefore(now)) {
      return (
        <span className="ml-auto text-xs font-medium text-red-500 bg-red-100 px-3 py-1.5 rounded-full">
          Completed
        </span>
      );
    } else {
      return (
        <span className="ml-auto text-xs font-medium text-green-800 bg-green-100 px-3 py-1.5 rounded-full">
          Upcoming
        </span>
      );
    }
  };

  const renderEventItem = (event: any) => (
    <div
      key={event.id}
      className="flex items-center p-3 gap-3 bg-gray-100 dark:bg-gray-800 rounded-md mb-2 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
      onClick={() => setSelectedEvent(event)}
    >
      <PiTagChevronBold className="h-5 w-5 text-gray-600 dark:text-gray-300" />
      <div>
        <h1 className="text-sm font-semibold text-gray-800 dark:text-gray-100">{event.name}</h1>
      </div>
      {getStatusBadge(event.startDate, event.endDate, event.type)}
    </div>
  );

  const renderAssignmentItem = (assignment: any) => (
    <div
      key={assignment.id}
      className="flex items-center p-3 gap-3 bg-gray-100 dark:bg-gray-800 rounded-md mb-2 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
      onClick={() => setSelectedEvent(assignment)}
    >
      <div>
        <h1 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
          {assignment.name}
        </h1>
      </div>
      {getStatusBadge(assignment.startDate, assignment.endDate, assignment.type)}
    </div>
  );

  const now = dayjs();
  const assignments = events?.filter((event) => event.type === "Assignment");
  const otherEvents = events?.filter((event) => event.type !== "Assignment");

  // live events
  const liveEvents = otherEvents?.filter((event) =>
    now.isBetween(dayjs(event.startDate), dayjs(event.endDate), null, "[]")
  );

  // upcoming events
  const upcomingEvents = otherEvents?.filter((event) => dayjs(event.startDate).isAfter(now));

  // completed events
  const completedEvents = otherEvents?.filter((event) => dayjs(event.endDate).isBefore(now));

  const renderEventSection = (
    title: string,
    eventList: any[],
    emptyMessage: string,
    defaultOpen = false
  ) => (
    <Collapsible defaultOpen={defaultOpen} className="space-y-2">
      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md p-2 text-left hover:bg-accent">
        <h2 className="text-base font-bold text-foreground">{title}</h2>
        <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2">
        {eventList.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-muted-foreground my-5">
            <MdEventRepeat className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground/50" />
            <p className="mt-4 text-sm">{emptyMessage}</p>
          </div>
        ) : (
          eventList.map(renderEventItem)
        )}
      </CollapsibleContent>
    </Collapsible>
  );

  const renderAssignmentSection = (assignments: any[], defaultOpen = false) => (
    <Collapsible defaultOpen={defaultOpen} className="space-y-2">
      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md p-2 text-left hover:bg-accent">
        <h2 className="text-base font-bold text-foreground">Assignments</h2>
        <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2">
        {assignments.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-muted-foreground my-5">
            <MdEventRepeat className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground/50" />
            <p className="mt-4 text-sm">No assignments available</p>
          </div>
        ) : (
          assignments.map(renderAssignmentItem)
        )}
      </CollapsibleContent>
    </Collapsible>
  );

  return (
    <div>
      <ScrollArea className="h-[85vh] overflow-y-auto">
        <Card className="w-full h-[85vh] rounded-lg bg-background p-4 shadow-md md:w-[290px]">
          {renderEventSection("Live Events", liveEvents, "No live events", true)}
          {renderEventSection("Upcoming Events", upcomingEvents, "No upcoming events", true)}
          {renderAssignmentSection(assignments, false)}
          {renderEventSection("Completed Events", completedEvents, "No completed events", false)}
        </Card>
      </ScrollArea>

      {selectedEvent && (
        <EventDetails event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}
    </div>
  );
};
