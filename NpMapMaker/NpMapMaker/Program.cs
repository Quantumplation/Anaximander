using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using Newtonsoft.Json.Linq;

namespace NpMapMaker
{
    class Program
    {
        static void Main(string[] args)
        {
            Dictionary<int, string> colors = new Dictionary<int, string>
            {
                { -1, "Grey" },
                { 0, "DarkBlue" },
                { 1, "CornflowerBlue " },
                { 2, "Lime" },
                { 3, "Yellow" },
                { 4, "OrangeRed" },
                { 5, "Crimson" },
                { 6, "HotPink" },
                { 7, "Purple" }
            };
            List<Point> points = new List<Point>();

            points.AddRange(Parse("data-Nyarlathothep.json", colors));
            points.AddRange(Parse("data-RedCapsule.json", colors));
            points.AddRange(Parse("data-PinkCapsule.json", colors));
            points.AddRange(Parse("data-OrangeHexagon.json", colors));
            points.AddRange(Parse("data-PinkHexagon.json", colors));

            var output = JArray.FromObject(points).ToString();
            string mapHtml = File.ReadAllText("map.html").Replace("JSON_GOES_HERE", output);

            File.WriteAllText("map2.html", mapHtml);
            Process.Start("map2.html");
        }

        private static IEnumerable<Point> Parse(string filename, Dictionary<int, string> colors)
        {
            JObject json = JObject.Parse(File.ReadAllText(filename));

            Console.WriteLine("Include " + filename + "?");
            if (Console.ReadLine() != "y")
                yield break;

            if ((string)json.SelectToken("event") != "order:full_universe")
                throw new InvalidDataException("JSON data should be full_universe");

            var stars = json.SelectToken("report").SelectToken("stars");
            foreach (var star in stars.Values())
            {
                //if (filename.Contains("Nyarlathothep"))
                //{
                //    if (((int)star.SelectToken("puid") == 2 && (string)star.SelectToken("n") != "Mahasim") || ((int)star.SelectToken("puid") == 3 && (string)star.SelectToken("n") != "Mekbuda"))
                //        continue;
                //}

                yield return new Point
                {
                    X = (float)star["x"],
                    Y = (float)star["y"],
                    Color = "red",// colors[(int)star["puid"]]
                };
            }
        }

        private struct Point
        {
            public float X;
            public float Y;
            public string Color;
        }
    }
}
