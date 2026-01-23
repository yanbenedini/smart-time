import React from "react";
import Dashboard from "./Dashboard";
import EmployeeManager from "./EmployeeManager";
import AbsenceManager from "./AbsenceManager";
import ShiftChangeManager from "./ShiftChangeManager";
import UserManager from "./UserManager";
import OnCallManager from "./OnCallManager";
import LogManager from "./LogManager";
import { SystemUser, View } from "../types";

interface MainContentProps {
    currentView: View;
    currentUser: SystemUser;
}

const MainContent: React.FC<MainContentProps> = ({ currentView, currentUser }) => {
    return (
        <>
            {currentView === View.DASHBOARD && <Dashboard />}
            {currentView === View.EMPLOYEES && (
                <EmployeeManager currentUser={currentUser} />
            )}
            {currentView === View.ABSENCES && (
                <AbsenceManager currentUser={currentUser} />
            )}
            {currentView === View.SHIFT_CHANGES && (
                <ShiftChangeManager currentUser={currentUser} />
            )}
            {currentView === View.ON_CALL && (
                <OnCallManager currentUser={currentUser} />
            )}
            {currentUser.isAdmin && currentView === View.USERS && (
                <UserManager currentUser={currentUser} />
            )}
            {currentUser.isAdmin && currentView === View.LOGS && (
                <LogManager currentUser={currentUser} />
            )}
        </>
    );
};

export default MainContent;
