/**This project is licensed under the terms of the
 * DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE, version 3,
 *   as published by theiostream on March 2012, as it follows:
 *
 *   0. You just DO WHAT THE FUCK YOU WANT TO.*/

 class TscPrinter {
  constructor(device) {
    this.device = device
  }

  Write(data) {
    const _t = this;
    return new Promise((resolve, reject) => {
      _t.device.open();
      let iface = _t.device.interface(0);
      function closeConnection() {
        if (iface) {
          try {
            _t.device.close();
          } catch (e) {
            setTimeout(closeConnection, 1000)
          }
        }
      }
      if (/^linux/.test(process.platform) || /^android/.test(process.platform)) {
        console.log('Linux!!!');
        if (iface.isKernelDriverActive()) {
          try {
            iface.detachKernelDriver();
          } catch (e) {
            console.error("[ERROR] Could not detach kernel driver: %s", e)
          }
        }
      }

      iface.claim();

      let outEndpoint = iface.endpoints.find(endpoint => endpoint.direction === 'out');
      let inEndpoint = iface.endpoints.find(endpoint => endpoint.direction === 'in');

      let finish = false;
      let transfered = false;

      function _resolve() {
        inEndpoint.stopPoll(function () {
          iface.release(() => {
            console.log('usb print finished !');
            // closeConnection();  // Commented due to Avoid error : "abort core dumped on linux" & "abort strap 6" on mac
            resolve();
          })
        })
      }

      inEndpoint.on('data', function (data) {
        if (!finish && data.length !== 0) {
          finish = true;
          if (transfered)
            _resolve();
        }
      })

      inEndpoint.on('error', function (e) {
        console.warn(e);
        closeConnection();
        return reject(err);
      })

      inEndpoint.startPoll(2, 8);

      outEndpoint.transfer(data, err => {
        transfered = true;
        console.log('transfer finished!');
        if (err) {
          console.log('USB CRASH'.red);
          console.warn(err);
          closeConnection();
          return reject(err);
        }

        if (finish) {
          _resolve();
        } else {
          setTimeout(function () {
            console.log('print Timeout !!!')
            if (!finish) {
              _resolve();
              finish = true;
            }
          }, 1500);
        }
      });

      outEndpoint.on('error', function (e) {
        console.warn(e);
        closeConnection();
        return reject(err);
      })
    })
  }

  Writev2(arr_data) {

    // DIRECT THERMAL PRINTER * LABEL PRINTER * 
    // # MODEL XPRINTER 

    const _t = this;

    return new Promise(async (resolve, reject) => {
      _t.device.open();
      console.log('DEVICE CONNECTION OPEN')


      let iface = _t.device.interface(0);

      function closeConnection() {
        if (iface) {
          try {
            _t.device.close();
          } catch (e) {
            setTimeout(closeConnection, 1000)
          }
        }
      }

      if (/^linux/.test(process.platform) || /^android/.test(process.platform)) {
        console.log('Linux!!!');
        if (iface.isKernelDriverActive()) {
          try {
            iface.detachKernelDriver();
          } catch (e) {
            console.error("[ERROR] Could not detach kernel driver: %s", e)
          }
        }
      }

      iface.claim();

      let outEndpoint = iface.endpoints.find(endpoint => endpoint.direction === 'out');
      let inEndpoint = iface.endpoints.find(endpoint => endpoint.direction === 'in');

      function _resolve(print_result) {
        inEndpoint.stopPoll(function () {
          iface.release(() => {
            console.log('USB PRINT COMPLETE!');
            // closeConnection();  // Commented due to Avoid error : "abort core dumped on linux" & "abort strap 6" on mac
            resolve(print_result);
          })
        })
      }

      inEndpoint.startPoll(2, 8);

      await arr_data.map((data, index) => {

          // WRITING DATA
          outEndpoint.transfer(data, err => {
            console.log('TRANSFER DATA BUFFER : ', data);

            if(arr_data.length -1 == index){
              _resolve({success : true})
            }

            if(err){
              _resolve({success : false, err})
            }
            
          });
    
          outEndpoint.on('error', function (e) {
            console.warn(e);
            closeConnection();
            return reject(err);
          })

          // RECEIVED DATA
          inEndpoint.on('data', function (data) {

            console.log('RECEIVING DATA ....')

            if (!finish && data.length !== 0) {
              finish = true;
              if (transfered)
                _resolve();
            }
          })
    
          inEndpoint.on('error', function (e) {
            console.warn(e);
            // closeConnection();
            return reject(err);
          })

      })
    })
  }

  Close(){
    const _t = this;
    _t.device.close();

    console.log('DEVICE CONNECTION CLOSE')
  }

}

module.exports = TscPrinter
