using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Web;

namespace breaker_js.Models
{
    public class Score
    {
        public int Id { get; set; }

        [StringLength(10)]
        public string Name { get; set; }

        public int PlayerScore { get; set; }
    }
}