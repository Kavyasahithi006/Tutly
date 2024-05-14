"use client";
import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import _ from "lodash";
import toast from "react-hot-toast";
import axios from "axios";

interface Student {
  Name: string;
  username: string;
  JoinTime: string;
  LeaveTime: string;
  Duration: string;
  UserEmail: string;
  RecordingDisclaimerResponse: string;
  InWaitingRoom: string;
}

const AttendanceClient = ({ courses }: any) => {
  const [fileData, setFileData] = useState<any>([]);
  const [selectedFile, setSelectedFile] = useState<any>();
  const [currentCourse, setCurrentCourse] = useState<any>(null);
  const [currentClass, setCurrentClass] = useState<any>(null);
  const [openCourses, setOpenCourses] = useState<boolean>(false);
  const [openClasses, setOpenClasses] = useState<boolean>(false);
  const [users, setUsers] = useState<any>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  useEffect(() => {
    if (!currentCourse) {
      return;
    }
    const fetch = async () => {
      const res = await axios.post("/api/course/students", {
        courseId: currentCourse.id,
      });
      setUsers(res.data);
    };
    fetch();
  }, [currentCourse]);

  const handleStudentClick = (student: any) => {
    setSelectedStudent(student);
  };

  const handleClosePopup = () => {
    setSelectedStudent(null);
  };

  const onSelectFile = (file: Blob) => {
    setSelectedFile(file);
    try {
      const reader = new FileReader();

      reader.onload = (e) => {
        const result = (e.target as FileReader).result;
        const workbook = XLSX.read(result, {
          type: "binary",
          cellDates: true,
        });
        const worksheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[worksheetName];

        const data = XLSX.utils.sheet_to_json(worksheet, {
          defval: "",
          range: { s: { c: 0, r: 3 }, e: { c: 6, r: 10000 } },
        });

        const modifiedData = data.map((row: any) => ({
          Name: row["Name (Original Name)"],
          username: String(row["Name (Original Name)"]).substring(0, 10),
          JoinTime: row["Join Time"],
          LeaveTime: row["Leave Time"],
          Duration: row["Duration (Minutes)"],
          UserEmail: row["User Email"],
          RecordingDisclaimerResponse: row["Recording Disclaimer Response"],
          InWaitingRoom: row["In Waiting Room"],
        }));
        setFileData(modifiedData);
      };
      reader.onerror = () => {
        throw new Error("Error in reading file");
      };

      reader.readAsText(file);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const aggregatedStudents = fileData.reduce((acc: any, student: Student) => {
    const { username } = student;
    if (!acc[username]) {
      acc[username] = {
        Name: student.Name,
        Joins: [
          {
            JoinTime: student.JoinTime,
            LeaveTime: student.LeaveTime,
            ActualName: student.Name,
            Duration: parseInt(student.Duration),
          },
        ],
        Duration: parseInt(student.Duration),
        username: student.username,
      };
    } else {
      acc[username].Joins.push({
        JoinTime: student.JoinTime,
        LeaveTime: student.LeaveTime,
        ActualName: student.Name,
        Duration: parseInt(student.Duration),
      });
      acc[username].Duration += parseInt(student.Duration);
    }
    return acc;
  }, {});

  const sortedAggregatedStudents = Object.values(aggregatedStudents).sort(
    (a: any, b: any) => {
      const usernameA = String(a.username).toUpperCase();
      const usernameB = String(b.username).toUpperCase();
      if (usernameA < usernameB) {
        return -1;
      }
      if (usernameA > usernameB) {
        return 1;
      }
      return 0;
    }
  );

  const modifiedAggregatedStudents = sortedAggregatedStudents.map(
    (student: any) => {
      const matchedUser = users.find(
        (user: any) => user.username === student.username
      );
      if (matchedUser) {
        return {
          ...student,
          Present: true,
          username: matchedUser.username,
          ActualName: matchedUser.name,
        };
      } else {
        return {
          ...student,
          Present: false,
          username: student.username || "",
          ActualName: student.Name || "",
        };
      }
    }
  );

  // Separate present and absent students
  const combinedStudents = modifiedAggregatedStudents.map((student: any) => ({
    ...student,
    Name: student.ActualName,
    username: student.username,
  }));

  const presentStudents = combinedStudents.filter(
    (student: any) => student.Present
  );
  const absentStudents = combinedStudents.filter(
    (student: any) => !student.Present
  );

  // edit student join name
  const [username, setUsername] = useState<string>("");
  const [openEditName, setOpenEditName] = useState<number>(0);
  const handleEditUsername = (from: any, to: any) => {
    fileData.map((student: any) => {
      student.username = student.username.replace(from, to);
    });
  };

  // upload attendance to db
  const handleUpload=async()=>{
    try {
      const res = await axios.post("/api/attendance", {
        classId: currentClass?.id,
        data: presentStudents
      })
      toast.success("Attendance uploaded successfully")
    } catch(e) {
      toast.error("something went wrong!")}
  }
  return (
    <div className="p-4 text-center ">
      <h1 className="text-4xl mt-4 font-semibold mb-4">Attendance</h1>
      <h1 className="text-center text-lg">Monitor your mentees attendance</h1>
      <div className="flex justify-between w-[80%] m-auto mt-8">
        <div className="flex gap-2 items-center">
          <div className="relative">
            {!currentCourse ? (
              <h1
                onClick={
                  courses.length === 0
                    ? () => toast.error("no courses exist")
                    : () => setOpenCourses(!openCourses)
                }
                className="px-2 py-1 rounded bg-primary-700 min-w-28 cursor-pointer"
              >
                select course
              </h1>
            ) : (
              <h1
                onClick={() => setOpenCourses(!openCourses)}
                className="px-2 py-1 rounded bg-primary-700 min-w-28 cursor-pointer"
              >
                {currentCourse.title}
              </h1>
            )}
            <div className="flex flex-col absolute bg-primary-800 w-full">
              {openCourses &&
                courses.map((course: any) => {
                  return (
                    <h1
                      onClick={() => {
                        setOpenCourses(!openCourses);
                        setCurrentCourse(course);
                      }}
                      className="border-b p-1 cursor-pointer hover:bg-primary-600"
                      key={course.id}
                    >
                      {course.title}
                    </h1>
                  );
                })}
            </div>
          </div>
          <div className="relative">
            {!currentClass ? (
              <h1
                onClick={
                  !currentCourse
                    ? () => toast.error("select course!")
                    : () => setOpenClasses(!openClasses)
                }
                className="px-2 py-1 rounded bg-primary-700 min-w-28 cursor-pointer"
              >
                select class
              </h1>
            ) : (
              <h1
                onClick={() => setOpenClasses(!openClasses)}
                className="px-2 py-1 rounded bg-primary-700 min-w-28 cursor-pointer"
              >
                {currentClass.title}
              </h1>
            )}
            <div className="flex flex-col absolute bg-primary-800 w-full">
              {openClasses &&
                currentCourse.classes.map((x: any) => {
                  return (
                    <h1
                      onClick={() => {
                        setCurrentClass(x);
                        setOpenClasses(!openClasses);
                      }}
                      className="border-b p-1 cursor-pointer hover:bg-primary-600"
                      key={x.id}
                    >
                      {x.title}
                    </h1>
                  );
                })}
            </div>
          </div>
        </div>
        <div>
          <input
            type="file"
            className="bg-primary-600 rounded cursor-pointer w-60 text-white font-semibold border-none outline-none shadow-md hover:bg-primary-700 transition duration-300 ease-in-out"
            accept=".csv, .xlsx"
            onChange={(e) => {
              const files = e.target.files;
              !currentClass
                ? toast.error("select class")
                : files && files.length > 0 && onSelectFile(files[0]);
            }}
          />
          {/* <div onClick={handleUpload} className="bg-primary-600 rounded p-1">upload</div> */}
        </div>
      </div>

      {/* Present Students Table */}
      {fileData && selectedFile && (
        <>
          <table className="w-[80%] m-auto mt-10">
            <thead>
              <tr className="border-b">
                <th>index</th>
                <th className="py-2 pl-10 text-start">Name</th>
                <th>Username</th>
                <th>Duration</th>
                <th>Date</th>
                <th>Times Joined</th>
                <th>view</th>
                <th>status</th>
              </tr>
            </thead>
            <tbody>
              {presentStudents.map((student: any, index) => (
                <tr
                  key={index}
                  className="hover:bg-primary-800 cursor-pointer"
                >
                  <td>{index + 1}</td>
                  <td className="py-2 pl-10 text-start">
                    {student.ActualName}
                  </td>
                  <td>{student.username}</td>
                  <td>
                    <p
                      className={`p-1 m-auto w-10 rounded ${
                        student.Duration < 30
                          ? "bg-red-500"
                          : student.Duration < 90
                          ? "bg-blue-500"
                          : "bg-green-500"
                      }`}
                    >
                      {student.Duration}
                    </p>
                  </td>
                  <td>{student.Joins[0].JoinTime.split(" ")[0]}</td>
                  <td>{student.Joins.length}</td>
                  <td
                        className="cursor-pointer"
                        onClick={() => handleStudentClick(student)}
                      >
                        view
                      </td>
                      <td>
                        <select>
                          <option value="absent">A</option>
                          <option value="present">P</option>
                        </select>
                      </td>
                </tr>
              ))}
              {users.map((student: any, index: number) => {
                const userInPresentStudents = presentStudents.find(
                  (x) => x.username === student.username
                );
                if (!userInPresentStudents)
                  return (
                    <tr key={index} className="hover:bg-primary-800">
                      <td>{index + 1}</td>
                      <td className="py-2 text-start pl-10">{student.name}</td>
                      <td>{student.username}</td>
                      <td>-</td>
                      <td>-</td>
                      <td>-</td>
                      <td>-</td>
                      <td
                        className="cursor-pointer"
                        onClick={() => handleStudentClick(student)}
                      >
                        view
                      </td>
                      <td>
                        <select>
                          <option value="absent">A</option>
                          <option value="present">P</option>
                        </select>
                      </td>
                    </tr>
                  );
              })}
            </tbody>
          </table>

          {/* Absent Students Table */}
          <table className="w-[80%] m-auto mt-10">
            <thead>
              <tr className="border-b">
                <th>index</th>
                <th className="py-2 text-start pl-10 max-w-52 text-pretty">
                  Joined Name
                </th>
                <th className="py-2">username</th>
                <th>Duration</th>
                <th>Date</th>
                <th>Times Joined</th>
                <th>view</th>
                <th>Edit</th>
              </tr>
            </thead>
            <tbody>
              {absentStudents.map(
                (
                  student: {
                    Name: string;
                    Joins: {
                      ActualName: string;
                      JoinTime: string;
                      Duration: number;
                    }[];
                    Duration: number;
                    username: string;
                  },
                  index
                ) => (
                  <tr key={index} className="hover:bg-primary-800">
                    <td>{index + 1}</td>
                    <td>{student.Joins[0].ActualName}</td>
                    {openEditName === Number(index + 1) ? (
                      <td className="text-start pl-10 py-2 max-w-52">
                        <input
                          className="block"
                          onChange={(e) => setUsername(e.target.value)}
                          defaultValue={student.username}
                        />
                      </td>
                    ) : (
                      <td className="text-start pl-10 py-2 max-w-52">
                        {student.username}
                      </td>
                    )}
                    <td>
                      <p
                        className={`p-1 m-auto w-10 rounded ${
                          student.Duration < 30
                            ? "bg-red-500"
                            : student.Duration < 90
                            ? "bg-blue-500"
                            : "bg-green-500"
                        }`}
                      >
                        {student.Duration}
                      </p>
                    </td>
                    <td>{String(student.Joins[0].JoinTime).split(" ")[0]}</td>
                    <td>{student.Joins.length}</td>

                    <td
                      className="cursor-pointer"
                      onClick={() => handleStudentClick(student)}
                    >
                      view
                    </td>
                    {openEditName !== index + 1 ? (
                      <td
                        className="hover:bg-red-400 cursor-pointer"
                        onClick={
                          openEditName === 0
                            ? () => setOpenEditName(index + 1)
                            : () => setOpenEditName(0)
                        }
                      >
                        edit
                      </td>
                    ) : (
                      <td
                        onClick={() => {
                          setOpenEditName(0);
                          handleEditUsername(student.username, username);
                        }}
                        className="hover:bg-red-400 cursor-pointer"
                      >
                        save
                      </td>
                    )}
                  </tr>
                )
              )}
            </tbody>
          </table>
        </>
      )}

      {selectedStudent && (
        <div className="fixed top-0 left-0 w-full h-full flex justify-center items-center bg-gray-800 bg-opacity-50">
          <div className="bg-white text-gray-700 p-4 rounded-md w-[60%]">
            <h2 className="text-lg font-semibold mb-2">
              Attendance Details for {String(selectedStudent?.Name)}
            </h2>
            <table className="w-full">
              <thead>
                <tr>
                  <th className="border px-4 py-2">Actual Name</th>
                  <th className="border px-4 py-2">Join Time</th>
                  <th className="border px-4 py-2">Leave Time</th>
                  <th className="border px-4 py-2">Duration</th>
                </tr>
              </thead>
              <tbody>
                {selectedStudent.Joins.map((join: any, index: number) => (
                  <tr key={index}>
                    <td className="border px-4 py-2">{join.ActualName}</td>
                    <td className="border px-4 py-2">{join.JoinTime}</td>
                    <td className="border px-4 py-2">{join.LeaveTime}</td>
                    <td className="border px-4 py-2">{join.Duration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              onClick={handleClosePopup}
            >
              Close
            </button>
          </div>
        </div>
      )}
      <div className="text-center text-xl font-bold mt-20">Under Progress...</div>
    </div>
  );
};

export default AttendanceClient;
