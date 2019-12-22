using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using breaker_js.Models;
using System.Web.Script.Serialization;

namespace breaker_js.Controllers
{
    public class HomeController : Controller
    {
        public ActionResult Index()
        {
            return View();
        }

        public ActionResult About()
        {
            ViewBag.Message = "Your application description page.";

            return View();
        }

        public ActionResult Contact()
        {
            ViewBag.Message = "Your contact page.";

            return View();
        }

        [HttpGet]
        public string GetScores()
        {
            HighScoreContext context = new HighScoreContext();
            IEnumerable<Score> data = context.Scores.OrderByDescending(x => x.PlayerScore).Take(100);
            string jsonData = new JavaScriptSerializer().Serialize(data);

            return jsonData;
        }

        public ActionResult ShowHighScores()
        {
            HighScoreContext context = new HighScoreContext();
            List<Score> data = context.Scores.OrderByDescending(x => x.PlayerScore).Take(100).ToList();
            return PartialView("_HighScores", data);

        }

        public ActionResult SaveHighScore(string playerName, int playerScore)
        {
            Score newScore = new Score { Name = playerName, PlayerScore = playerScore };
            using (HighScoreContext context = new HighScoreContext())
            {
                context.Scores.Add(newScore);
                context.SaveChanges();
            }
            return ShowHighScores();
        }
    }
}