(ns Anaximander.core
  (:use [compojure.core]
        [clojure.java.io]
        ring.middleware.cors)
  (:require [compojure.handler :as handler]
            [compojure.route :as route]
            [clojure.data.json :as json]
            [clojure.contrib.java-utils :as io]
            [clojure.java.io :as jio]))

;; Request helpers
(defn fromJson [payload]
  (json/read-str payload :key-fn keyword))

(defn getPayload [request]
  (fromJson (:payload (:params request))))

(defn player [report id]
  (get (:players report) (keyword (str id))))


;; Routes
(defroutes app-routes
  (POST "/Anaximander" [payload :as request]
    (let [pload (getPayload request)
          report (:report pload)
          puid (:player_uid report)
          name (:alias (player report puid))] 
      (do (with-open [wrtr (writer (str "dumps/" name ".json"))]
           (.write wrtr (str pload)))
          (str name)))))

(def app 
  (-> (handler/site app-routes)
      (wrap-cors :access-control-allow-origin #"http://triton.ironhelmet.com")))
