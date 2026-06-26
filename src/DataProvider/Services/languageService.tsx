import { Language } from "../../Domain/ProductLineEngineering/Entities/Language";
import { LANGUAGES_CLIENT } from "../../Infraestructure/AxiosConfig";


export function getLanguagesDetail(): Promise<Language[]> {
  return new Promise((resolve, reject) => {
    LANGUAGES_CLIENT.get("/languages/detail")
      .then((res) => {
        let responseAPISuccess: ResponseAPISuccess =
          new ResponseAPISuccess();

        responseAPISuccess = Object.assign(
          responseAPISuccess,
          res.data
        );

        if (responseAPISuccess.message?.includes("Error")) {
          return reject(new Error(JSON.stringify(res.data)));
        }

        const languages: Language[] = Object.assign(
          [],
          responseAPISuccess.data
        );

        resolve(languages);
      })
      .catch((error) => {
        console.log("Something wrong in getLanguageDetail Service:", error);
        reject(error);
      });
  });
}
export function getLanguagesByUser(userId: string): Promise<Language[]> { 
  let url = "/languagesbyuser/" + userId;
  
  // 🟢 LOGS D'INSPECTION AVANT ENVOI
  console.log("🔍 [Service] URL finale générée :", url);
  console.log("🔍 [Service] Axios Client Config (Headers) :", LANGUAGES_CLIENT.defaults.headers);

  return LANGUAGES_CLIENT.get(url).then((res) => {
    let responseAPISuccess: ResponseAPISuccess = new ResponseAPISuccess();
    responseAPISuccess = Object.assign(responseAPISuccess, res.data);

    if (responseAPISuccess.message?.includes("Error")) {
      throw new Error(JSON.stringify(res.data));
    }

    let languages: Language[] = [];
    languages = Object.assign(languages, responseAPISuccess.data);
    return languages; 
  }).catch((error) => {
    // 🟢 LOGS D'INSPECTION DE L'ERREUR 400
    if (error.response) {
      console.error("🔴 [Service API 400] Le serveur a répondu :", error.response.data);
      console.error("🔴 [Service API 400] Headers envoyés :", error.config.headers);
    }
    throw error;
  });
}

  export function createLanguage(callback: any, language: Language, user: string) {
    let response: string;

    // Standard Request Start
    let requestBody = {
      transactionId: "createLanguage_Frontend",
      data: language,
      user: user
    };
    // Standard Request End

    try {
      LANGUAGES_CLIENT.post("/languages", requestBody).then((res) => {
        let responseAPISuccess: ResponseAPISuccess = new ResponseAPISuccess();
        responseAPISuccess = Object.assign(responseAPISuccess, res.data);
        response = responseAPISuccess.message;

        if (responseAPISuccess.message?.includes("Error"))
          throw new Error(JSON.stringify(res.data));

        callback(response);
      }).catch(function (error) {
        console.log(JSON.stringify(error));
        let response = {
          messageError: "Something wrong in createLanguage Service."
        }
        if (error.response) { 
          if (error.response.data) { 
            if (error.response.data.data) { 
              response = JSON.parse(error.response.data.data);
            }
          }
        }
        callback(response);
      });
    } catch (error) {
      response = "Something wrong in createLanguage Service: " + error;
      console.log(response);
      callback(response);
    }
  }

  export function deleteLanguage(callback: any, languageId: string, user: string) {
    let response: string;

    // Standard Request Start
    let requestBody = {
      transactionId: "deleteLanguage_Frontend",
    };
    // Standard Request End

    try {
      LANGUAGES_CLIENT.delete("/languages/" + languageId + "/" + user, {data: requestBody}).then((res) => {
        let responseAPISuccess: ResponseAPISuccess = new ResponseAPISuccess();
        responseAPISuccess = Object.assign(responseAPISuccess, res.data);
        response = responseAPISuccess.message;

        if (responseAPISuccess.message?.includes("Error"))
          throw new Error(JSON.stringify(res.data));

        callback(response);
      }).catch(function (error) {
        console.log(JSON.stringify(error));
        let response = {
          messageError: "Something wrong in createLanguage Service."
        }
        if (error.response) { 
          if (error.response.data) { 
            if (error.response.data.data) { 
              response = JSON.parse(error.response.data.data);
            }
          }
        }
        callback(response);
      });
    } catch (error) {
      response = "Something wrong in deleteLanguage Service: " + error;
      console.log(response);
      callback(response);
    }
  }

  export function updateLanguage(callback: any, language: Language, user: string) {
    let response: string;

    // Standard Request Start
    let requestBody = {
      transactionId: "updateLanguage_Frontend",
      data: language,
      user: user
    };

    try {
      LANGUAGES_CLIENT.put("/languages/" + language.id, requestBody).then((res) => {
        let responseAPISuccess: ResponseAPISuccess = new ResponseAPISuccess();
        responseAPISuccess = Object.assign(responseAPISuccess, res.data);
        response = responseAPISuccess.message;

        if (responseAPISuccess.message?.includes("Error"))
          throw new Error(JSON.stringify(res.data));

        callback(response);
      }).catch(function (error) {
        console.log(JSON.stringify(error));
        let response = {
          messageError: "Something wrong in createLanguage Service."
        }
        if (error.response) { 
          if (error.response.data) { 
            if (error.response.data.data) { 
              response = JSON.parse(error.response.data.data);
            }
          }
        }
        callback(response);
      });
    } catch (error) {
      response = "Something wrong in createLanguage Service: " + error;
      console.log(response);
      callback(response);
    }
  }

  export function getLanguages(callBack: any) {
    let languages: Language[] = [];
    try {
      LANGUAGES_CLIENT.get("/languages/detail").then((res) => {
        let responseAPISuccess: ResponseAPISuccess = new ResponseAPISuccess();
        responseAPISuccess = Object.assign(responseAPISuccess, res.data);

        if (responseAPISuccess.message?.includes("Error"))
          throw new Error(JSON.stringify(res.data));

        languages = Object.assign(languages, responseAPISuccess.data);
        callBack(languages);
      });
    } catch (error) {
      console.log("Something wrong in getLanguages service: " + error);
      callBack(languages);
    }
  }


export class ResponseAPISuccess {
  transactionId?: string;
  message?: string;
  data?: JSON;
  constructor(transactionId?: string, message?: string, data?: JSON) {
    this.transactionId = transactionId;
    this.message = message;
    this.data = data;
  }
}

export class ResponseAPIError {
  transactionId?: string;
  message?: string;
  errorCode?: string;
  data?: JSON;
  constructor(
    transactionId?: string,
    message?: string,
    errorCode?: string,
    data?: JSON
  ) {
    this.transactionId = transactionId;
    this.message = message;
    this.errorCode = errorCode;
    this.data = data;
  }
}
