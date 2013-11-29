(ns Anaximander.core
  (:use [compojure.core]
        [clojure.java.io]
        ring.middleware.cors)
  (:require [compojure.handler :as handler]
            [compojure.route :as route]
            [clojure.data.json :as json]
            [clojure.java.io :as jio]
            [me.raynes.conch :as conch]))

(conch/programs mkdir)

;; Request helpers
(defn fromJson [payload]
  (json/read-str payload :key-fn keyword))

(defn getPayload [request]
  (fromJson (:payload (:params request))))

(defn player [report id]
  (get (:players report) (keyword (str id))))

(defn saveDump [request]
  (let [payload (:payload (:params request))
        dump (fromJson payload)
        report (:report dump)
        puid (:player_uid report)
        name (:alias (player report puid))
        tick (:tick report)
        dir (str "dumps/" tick "/")
        path (str dir name ".json")]
     (do
       (mkdir dir)
       (with-open [wrtr (writer path)]
         (.write wrtr (str payload))))))

;; Routes
(defroutes app-routes
  (POST "/Anaximander" [payload :as request]
    (let [pload (getPayload request)
          report (:report pload)
          puid (:player_uid report)
          name (:alias (player report puid))] 
      (do
        (saveDump request) 
        (str name)))))

(def app 
  (-> (handler/site app-routes)
      (wrap-cors :access-control-allow-origin #"http://triton.ironhelmet.com")))
