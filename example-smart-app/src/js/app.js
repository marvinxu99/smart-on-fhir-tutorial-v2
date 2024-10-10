(function(window) {
    window.extractData = function() {
      // Use modern promises
      return new Promise((resolve, reject) => {
  
        // Handle error
        function onError() {
          console.log('Loading error', arguments);
          reject();
        }
  
        // Handle successful SMART on FHIR connection
        function onReady(client) {
          if (client.patient) {
            // Fetch patient details
            const pt = client.request(`Patient/${client.patient.id}`);
  
            // Fetch observations
            const obv = client.request("Observation", {
              graph: true,
              pageLimit: 0,  // Load all pages
              flat: true,
              query: {
                code: {
                  $or: [
                    'http://loinc.org|8302-2',  // Body height
                    'http://loinc.org|8462-4',  // Diastolic BP
                    'http://loinc.org|8480-6',  // Systolic BP
                    'http://loinc.org|2085-9',  // HDL cholesterol
                    'http://loinc.org|2089-1',  // LDL cholesterol
                    'http://loinc.org|55284-4'  // Blood pressure panel
                  ]
                }
              }
            });
  
            // Use Promises instead of jQuery's `$.when`
            Promise.all([pt, obv]).then(([patient, observations]) => {
              const byCodes = client.byCodes(observations, 'code');
              const gender = patient.gender;
  
              let fname = '';
              let lname = '';
  
              if (patient.name && patient.name[0]) {
                fname = patient.name[0].given.join(' ');
                lname = patient.name[0].family.join(' ');
              }
  
              const height = byCodes('8302-2');
              const systolicbp = getBloodPressureValue(byCodes('55284-4'), '8480-6');
              const diastolicbp = getBloodPressureValue(byCodes('55284-4'), '8462-4');
              const hdl = byCodes('2085-9');
              const ldl = byCodes('2089-1');
  
              const p = defaultPatient();
              p.birthdate = patient.birthDate;
              p.gender = gender;
              p.fname = fname;
              p.lname = lname;
              p.height = getQuantityValueAndUnit(height[0]);
  
              if (systolicbp) {
                p.systolicbp = systolicbp;
              }
  
              if (diastolicbp) {
                p.diastolicbp = diastolicbp;
              }
  
              p.hdl = getQuantityValueAndUnit(hdl[0]);
              p.ldl = getQuantityValueAndUnit(ldl[0]);
  
              resolve(p);
            }).catch(onError);
          } else {
            onError();
          }
        }
  
        // FHIR OAuth2 ready function using Promises
        FHIR.oauth2.ready().then(onReady).catch(onError);
      });
    };
  
    // Default patient template
    function defaultPatient() {
      return {
        fname: '',
        lname: '',
        gender: '',
        birthdate: '',
        height: '',
        systolicbp: '',
        diastolicbp: '',
        ldl: '',
        hdl: ''
      };
    }
  
    // Get blood pressure values
    function getBloodPressureValue(BPObservations, typeOfPressure) {
      const BP = BPObservations.find(observation => {
        return observation.component.some(component => {
          return component.code.coding.some(coding => coding.code === typeOfPressure);
        });
      });
  
      if (BP) {
        return getQuantityValueAndUnit(BP.component.find(component => {
          return component.code.coding.some(coding => coding.code === typeOfPressure);
        }));
      }
    }
  
    // Extract quantity value and unit
    function getQuantityValueAndUnit(ob) {
      if (ob && ob.valueQuantity) {
        return `${ob.valueQuantity.value} ${ob.valueQuantity.unit}`;
      }
      return undefined;
    }
  
    // Visualization function
    window.drawVisualization = function(p) {
      document.getElementById('holder').style.display = 'block';
      document.getElementById('loading').style.display = 'none';
      document.getElementById('fname').textContent = p.fname;
      document.getElementById('lname').textContent = p.lname;
      document.getElementById('gender').textContent = p.gender;
      document.getElementById('birthdate').textContent = p.birthdate;
      document.getElementById('height').textContent = p.height;
      document.getElementById('systolicbp').textContent = p.systolicbp;
      document.getElementById('diastolicbp').textContent = p.diastolicbp;
      document.getElementById('ldl').textContent = p.ldl;
      document.getElementById('hdl').textContent = p.hdl;
    };
  
  })(window);
  