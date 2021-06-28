package cron

import (
	"encoding/json"
	"log"
	"sort"
	"time"
)

type JobInterface interface {
	Weekday() time.Weekday
	TimeOfDay() int
	Hour() int
	Minute() int
	Override(t time.Time)
	Next(asof time.Time) time.Time
	Skip(asof time.Time)
	Run()
}

type Job struct {
	weekday time.Weekday
	timeOfDay int
	action func()
	override *time.Time
}

func NewJob(wd time.Weekday, tod int, f func()) *Job {
	j := &Job{
		weekday: wd,
		timeOfDay: tod,
		action: f,
	}
	return j
}

func (j *Job) MarshalJSON() ([]byte, error) {
	m := map[string]interface{}{
		"weekday": j.Weekday(),
		"time": j.TimeOfDay(),
	}
	if j.override != nil {
		m["override"] = j.override.Unix() * 1000
	}
	return json.Marshal(m)
}

func (j *Job) Weekday() time.Weekday {
	return j.weekday
}

func (j *Job) TimeOfDay() int {
	return j.timeOfDay
}

func (j *Job) Hour() int {
	return j.timeOfDay / 3600000
}

func (j *Job) Minute() int {
	return (j.timeOfDay % 3600000) / 60000
}

func (j *Job) GetOverride() *time.Time {
	return j.override
}

func (j *Job) nextDefault(asof time.Time) time.Time {
	y, m, d := asof.Date()
	t := time.Date(y, m, d, 0, 0, 0, 0, asof.Location())
	t = t.Add(time.Duration(j.timeOfDay) * time.Millisecond)
	add := (7 + int(j.weekday) - int(t.Weekday())) % 7
	if add > 0 {
		t = t.AddDate(0, 0, add)
	}
	if t.Before(asof) {
		t = t.AddDate(0, 0, 7)
	}
	return t
}

func (j *Job) Override(t time.Time) {
	j.override = &t
}

func (j *Job) Skip(asof time.Time) {
	j.Override(j.nextDefault(asof).AddDate(0, 0, 7))
}

func (j *Job) Run() {
	if j.override != nil {
		j.override = nil
	}
	go j.action()
}

func (j *Job) Next(asof time.Time) time.Time {
	if j.override != nil {
		if !j.override.Before(asof) {
			return *j.override
		}
	}
	return j.nextDefault(asof)
}

type Schedule struct {
	jobs []JobInterface
	timer *time.Timer
}

func NewSchedule() *Schedule {
	return &Schedule{
		jobs: []JobInterface{},
		timer: nil,
	}
}

func (s *Schedule) MarshalJSON() ([]byte, error) {
	s.Sort()
	return json.Marshal(s.jobs)
}

func (s *Schedule) Len() int { return len(s.jobs) }
func (s *Schedule) Swap(i, j int) { s.jobs[i], s.jobs[j] = s.jobs[j], s.jobs[i] }
func (s *Schedule) Less(i, j int) bool {
	return s.jobs[i].Weekday() < s.jobs[j].Weekday()
}

func (s *Schedule) Sort() {
	sort.Sort(s)
}

func (s *Schedule) Jobs() []JobInterface {
	return s.jobs
}

func (s *Schedule) Next(asof time.Time) JobInterface {
	if len(s.jobs) == 0 {
		return nil
	}
	j := s.jobs[0]
	t := j.Next(asof)
	for _, xj := range s.jobs[1:] {
		xt := xj.Next(asof)
		if xt.Before(t) {
			j = xj
			t = xt
		}
	}
	return j
}

func (s *Schedule) Run() {
	if s.timer != nil {
		s.Stop()
	}
	now := time.Now()
	j := s.Next(now)
	if j == nil {
		return
	}
	t := j.Next(now)
	d := t.Sub(now)
	f := func() {
		if s.timer != nil {
			s.timer = nil
			j.Run()
			s.Run()
		}
	}
	s.timer = time.AfterFunc(d, f)
	log.Printf("running job at %s (%s)", t.Format("15:04:05"), d.String())
}

func (s *Schedule) Stop() {
	if s.timer != nil {
		t := s.timer
		s.timer = nil
		t.Stop()
	}
}

func (s *Schedule) AddJob(j JobInterface) {
	running := s.timer != nil
	s.Stop()
	s.jobs = append(s.jobs, j)
	if running {
		s.Run()
	}
}

func (s *Schedule) RemoveJob(j JobInterface) {
	running := s.timer != nil
	s.Stop()
	jobs := []JobInterface{}
	for _, x := range s.jobs {
		if x != j {
			jobs = append(jobs, j)
		}
	}
	s.jobs = jobs
	if running {
		s.Run()
	}
}

func (s *Schedule) Override(t time.Time) {
	running := s.timer != nil
	s.Stop()
	now := time.Now()
	j := s.Next(now)
	j.Override(t)
	for _, x := range s.jobs[1:] {
		for !x.Next(now).After(t) {
			x.Skip(now)
		}
	}
	if running {
		s.Run()
	}
}

func (s *Schedule) OverrideJob(j JobInterface, t time.Time) {
	running := s.timer != nil
	s.Stop()
	found := false
	for _, x := range s.jobs {
		if x == j {
			found = true
			break
		}
	}
	if !found {
		s.AddJob(j)
	}
	j.Override(t)
	if running {
		s.Run()
	}
}

