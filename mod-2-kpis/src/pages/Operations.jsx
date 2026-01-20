import React from "react";
import TrafficLight from "../components/TrafficLight";
import StaffRanking from "../components/StaffRanking";
import StaffMetricsPage from "../components/StaffMetrics";

const Operations = () => {
    return (
        <div>
            <StaffRanking />
            <TrafficLight />
            <StaffMetricsPage />
        </div>
        
    );
};

export default Operations