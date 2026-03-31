// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PermitLedger {
    struct PermitRecord {
        string permitNumber;
        string departmentName;
        string roadName;
        string ward;
        string workType;
        uint256 startDate;
        uint256 endDate;
        string status;
        uint256 timestamp;
        address submittedBy;
    }

    mapping(string => PermitRecord[]) public permitHistory;
    mapping(string => bool) public permitExists;

    event PermitSubmitted(string indexed permitNumber, string status, uint256 timestamp);
    event PermitUpdated(string indexed permitNumber, string newStatus, uint256 timestamp);

    function submitPermit(
        string memory permitNumber,
        string memory departmentName,
        string memory roadName,
        string memory ward,
        string memory workType,
        uint256 startDate,
        uint256 endDate
    ) public {
        PermitRecord memory record = PermitRecord({
            permitNumber: permitNumber,
            departmentName: departmentName,
            roadName: roadName,
            ward: ward,
            workType: workType,
            startDate: startDate,
            endDate: endDate,
            status: "submitted",
            timestamp: block.timestamp,
            submittedBy: msg.sender
        });

        permitHistory[permitNumber].push(record);
        permitExists[permitNumber] = true;

        emit PermitSubmitted(permitNumber, "submitted", block.timestamp);
    }

    function updatePermitStatus(string memory permitNumber, string memory newStatus) public {
        require(permitExists[permitNumber], "Permit does not exist");
        PermitRecord memory latest = permitHistory[permitNumber][permitHistory[permitNumber].length - 1];
        latest.status = newStatus;
        latest.timestamp = block.timestamp;
        permitHistory[permitNumber].push(latest);
        emit PermitUpdated(permitNumber, newStatus, block.timestamp);
    }

    function getPermitHistory(string memory permitNumber) public view returns (PermitRecord[] memory) {
        return permitHistory[permitNumber];
    }

    function getLatestStatus(string memory permitNumber) public view returns (string memory) {
        require(permitExists[permitNumber], "Permit does not exist");
        uint256 len = permitHistory[permitNumber].length;
        return permitHistory[permitNumber][len - 1].status;
    }
}

