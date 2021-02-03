var SerialPort = require('serialport')
const ByteLength = require('@serialport/parser-byte-length')

function getChecksum(dataByte) {
    summe = 0
    for (ctr = 1; ctr < 8; ctr++) {
        //console.log("dataByte: " + dataByte[ctr])
        summe += dataByte[ctr]
    }
    summe %= 0x100
    summe = (0xff - summe) + 1
    return summe
}

function generateSpanCalibrationCommand(currentCO2) {
    byte3 = Math.floor(currentCO2 / 256);
    byte4 = currentCO2 % 256;
    var ret = Buffer.from([0xff, 0x01, 0x88, byte3, byte4, 0, 0, 0]);
    checksum = new Uint8Array([getChecksum(ret)]);
    ret = Buffer.concat([ret, checksum]);
    return ret;
}

module.exports = function (RED) {
    function MHZ19CO2Sensor(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        const readCO2Command = Buffer.from([255, 1, 134, 0, 0, 0, 0, 0, 121]);
        const setCO2To400Command = Buffer.from([0xFF, 0x01, 0x87, 0x00, 0x00, 0x00, 0x00, 0x00, 0x78]);
        const ABCoffCommand = Buffer.from([0xFF, 0x01, 0x79, 0x00, 0x00, 0x00, 0x00, 0x00, 0x86]);
        const ABConCommand = Buffer.from([0xFF, 0x01, 0x79, 0xA0, 0x00, 0x00, 0x00, 0x00, 0xE6]);



        //getChecksum(Buffer.from([255, 1, 134, 0, 0, 0, 0, 0, 121]);
        node.on('input', function (msg, send, done) {
            // For maximum backwards compatibility, check that send exists.
            // If this node is installed in Node-RED 0.x, it will need to
            // fallback to using `node.send`
            send = send || function () { node.send.apply(node, arguments) }

            serialport = msg.serialport || config.serialport;

            node.port = new SerialPort(serialport, { baudRate: 9600 })
            node.port.on('error', function (err) {
                if (String(err) != "Error: Port is not open") {
                    done(err.message)
                }
            })

            function showPortOpen() {
                //console.log('port open. Data rate: ' + node.port.baudRate);
                setTimeout(() => {
                    node.port.close();
                }, 125);
            }
            node.port.on('open', showPortOpen);

            function showPortClose() {
                //console.log('port closed.');
            }
            node.port.on('close', showPortClose);
            const parser = node.port.pipe(new ByteLength({ length: 9 }));
            parser.on('data', function (daten) {
                //console.log(daten);
                msg.payload = {};
                msg.payload.CO2 = daten[2] * 256 + daten[3];
                msg.payload.temperature = daten[4] - 40;
				msg.payload.checksumCorrect = (getChecksum(daten) == daten[8]) ? true : false;
				node.status({fill:"green",shape:"dot",text: msg.payload.CO2 + " ppm CO2"});
                send(msg);
                node.port.close();
                if (done) {
                    done();
                }
            });

            switch (msg.payload) {
                case "getCO2":
					node.port.write(readCO2Command);
					break;
                case "setCO2To400":
                    node.port.write(setCO2To400Command);
                    break;
                case "ABCoff":
                    node.port.write(ABCoffCommand);
                    break;
                case "ABCon":
                    node.port.write(ABConCommand);
                    break;
                case "spanCalibration":
                    if (msg.CO2) {
                        co2 = parseInt(msg.CO2)
                        if (isNaN(co2)) {
                            done("Please specify a valid input number")
                        }
                        else {
                            node.port.write(generateSpanCalibrationCommand(co2));
                        }

                    }
                    else {
                        done("Please specify the CO2 value in msg.CO2")
                    }
                    break;
                default:
					node.status({fill:"red",shape:"ring",text: "Invalid input"});
                    done("Invalid input. Please see Node's help");
            }
        });

        node.on('close', function () {
            //node.warn("closing");
            //console.log("beende node");
            //node.port.close();
        });
    }
    RED.nodes.registerType("MH-Z19-CO2Sensor", MHZ19CO2Sensor);
}
