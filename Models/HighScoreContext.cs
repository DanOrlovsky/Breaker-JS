using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Linq;
using System.Web;

namespace breaker_js.Models
{
    public class HighScoreContext : DbContext
    {
        public HighScoreContext() : base("defaultConnection")
        {
            Database.SetInitializer(new HighScoreInitializer());
        }

        public DbSet<Score> Scores { get; set; }
    }
}