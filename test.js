const loop = {
    "localhost": {
        "Hardware Informations":
        {
            "Computer Type": "Linux",
            "CPU Type": "",
            "CPU Available": 4,
            "CPU Used (%)": 20.8,
            "RAM Available (GB)": 7.69,
            "RAM Used (GB)": 4.85,
            "Disk Available (GB)": 382.49,
            "Disk Used (GB)": 361.09,
            "IP Addresses": ["127.0.0.1", "192.168.57.200", "172.18.0.1", "172.17.0.1"],
            "MAC Addresses": ["00:00:00:00:00:00", "60:70:72:0a:81:fb", "02:42:64:8b:fa:4b", "02:42:b0:b4:30:de", "3c:a8:2a:b0:c6:33", "d8:5d:e2:a0:a1:f3"]
        },
        "MAC address": "60:70:72:0a:81:fb",
        "Hostname": "localhost",
        "Device Type": "Device by SHENZHEN HONGDE SMART LINK TECHNOLOGY CO., LTD",
        "Internet speedtest": { "Internet Speed": "Error during speed test: <urlopen error [Errno -2] Name or service not known>" },
        "External vulnerability": []
    }
}

console.log('====================================');
const st = JSON.stringify(loop)
console.log('====================================');

console.log('====================================');
console.log('Ad Scan' in JSON.parse(st));
console.log('====================================');
