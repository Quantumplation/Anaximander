(defproject Anaximander "1.0.0-SNAPSHOT"
  :description "FIXME: write description"
  :dependencies [[org.clojure/clojure "1.5.1"]
                 [org.clojure/clojure-contrib "1.2.0"]
                 [org.clojure/core.async "0.1.242.0-44b1e3-alpha"]
                 [compojure "1.1.5"]
                 [ring/ring-json "0.1.2"]
                 [org.clojure/data.json "0.2.3"]
		 [ring-cors "0.1.0"]]
  :plugins [[lein-ring "0.7.3"]]
  :ring {:handler Anaximander.core/app}
  :profiles {:dev {:dependencies [[ring-mock "0.1.3"]]}}
  :main Anaximander.core)
