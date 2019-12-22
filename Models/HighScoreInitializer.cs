using System.Collections.Generic;
using System.Data.Entity;

namespace breaker_js.Models
{
    internal class HighScoreInitializer : DropCreateDatabaseIfModelChanges<HighScoreContext>
    {

        protected override void Seed(HighScoreContext context)
        {
            List<Score> scores = new List<Score>();
            scores.Add(new Score { Name = "Martin D.", PlayerScore = 120 });
            scores.Add(new Score { Name = "Charles M.", PlayerScore = 310 });
            scores.Add(new Score { Name = "Ashley J.", PlayerScore = 220 });
            scores.Add(new Score { Name = "Mary K.", PlayerScore = 320 });
            scores.Add(new Score { Name = "Bruce A.", PlayerScore = 20 });
            scores.Add(new Score { Name = "Jose S.", PlayerScore = 40 });
            context.Scores.AddRange(scores);
            context.SaveChanges();
        }
    }
}