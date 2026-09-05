import type { QuestionSet, RoundData } from './types';

const makeRound = (
  values: number[],
  categories: string[],
  clues: Array<Array<[string, string]>>,
  doublePortions: Array<[number, number]>,
): RoundData => ({
  categories,
  values,
  clues: clues.map((category, cat) =>
    category.map(([text, answer], row) => ({
      text,
      answer,
      doublePortion: doublePortions.some(([dpCat, dpRow]) => dpCat === cat && dpRow === row),
    })),
  ),
});

export const SAMPLE_SET: QuestionSet = {
  id: '',
  ownerId: '',
  title: 'Bible Basics Sample',
  updatedAt: 0,
  round1: makeRound(
    [200, 400, 600, 800, 1000],
    ['Creation', 'Patriarchs', 'Exodus', 'Kings', 'Prophets', 'Gospels'],
    [
      [
        ['God created these two great lights to rule day and night.', 'What are the sun and moon?'],
        ['This garden was the first home of Adam and Eve.', 'What is Eden?'],
        ['God rested on this day after creation.', 'What is the seventh day?'],
        ['This sign was set in the clouds after the flood.', 'What is the rainbow?'],
        ['This tower was built when people sought to make a name for themselves.', 'What is Babel?'],
      ],
      [
        ['He was promised descendants as numerous as the stars.', 'Who is Abraham?'],
        ['He wrestled through the night and was named Israel.', 'Who is Jacob?'],
        ['He wore a special coat and interpreted dreams in Egypt.', 'Who is Joseph?'],
        ['Abraham offered this son on Mount Moriah.', 'Who is Isaac?'],
        ['Jacob worked fourteen years to marry this woman.', 'Who is Rachel?'],
      ],
      [
        ['God spoke to Moses from this burning object.', 'What is a bush?'],
        ['This sea parted as Israel escaped Egypt.', 'What is the Red Sea?'],
        ['Bread from heaven fed Israel in the wilderness.', 'What is manna?'],
        ['The commandments were given on this mountain.', 'What is Sinai?'],
        ['This brother of Moses became Israel\'s first high priest.', 'Who is Aaron?'],
      ],
      [
        ['This shepherd boy defeated Goliath.', 'Who is David?'],
        ['This king asked God for wisdom.', 'Who is Solomon?'],
        ['Israel’s first king came from the tribe of Benjamin.', 'Who is Saul?'],
        ['This queen saved her people in Persia.', 'Who is Esther?'],
        ['This king saw writing on the wall during a feast.', 'Who is Belshazzar?'],
      ],
      [
        ['He spent three days inside a great fish.', 'Who is Jonah?'],
        ['He challenged the prophets of Baal on Mount Carmel.', 'Who is Elijah?'],
        ['He interpreted Nebuchadnezzar’s dream.', 'Who is Daniel?'],
        ['He saw a valley of dry bones.', 'Who is Ezekiel?'],
        ['This prophet spoke of a suffering servant.', 'Who is Isaiah?'],
      ],
      [
        ['Jesus was born in this town.', 'What is Bethlehem?'],
        ['This river is where Jesus was baptized.', 'What is the Jordan?'],
        ['Jesus fed five thousand with bread and these.', 'What are fish?'],
        ['This disciple walked on water briefly.', 'Who is Peter?'],
        ['Jesus raised this man after four days in the tomb.', 'Who is Lazarus?'],
      ],
    ],
    [[2, 4]],
  ),
  round2: makeRound(
    [400, 800, 1200, 1600, 2000],
    ['Letters', 'Parables', 'Journeys', 'Worship', 'Wisdom', 'Revelation'],
    [
      [
        ['Paul wrote this letter about love, gifts, and resurrection.', 'What is 1 Corinthians?'],
        ['This short letter asks Philemon to receive Onesimus.', 'What is Philemon?'],
        ['James says this without works is dead.', 'What is faith?'],
        ['Hebrews calls this patriarch a priest of God Most High.', 'Who is Melchizedek?'],
        ['This letter describes the armor of God.', 'What is Ephesians?'],
      ],
      [
        ['A Samaritan helped a wounded man on this road.', 'What is the road to Jericho?'],
        ['A son returned home after wasting his inheritance.', 'Who is the prodigal son?'],
        ['Seed fell on paths, rocks, thorns, and this.', 'What is good soil?'],
        ['Ten virgins waited for this person.', 'Who is the bridegroom?'],
        ['A pearl of great price pictures this kingdom.', 'What is the kingdom of heaven?'],
      ],
      [
        ['Paul met the risen Jesus on the road to this city.', 'What is Damascus?'],
        ['The Spirit sent Paul and Barnabas from this church.', 'What is Antioch?'],
        ['Paul and Silas sang in prison in this city.', 'What is Philippi?'],
        ['This couple explained the way more accurately to Apollos.', 'Who are Priscilla and Aquila?'],
        ['Paul was shipwrecked on this island.', 'What is Malta?'],
      ],
      [
        ['The tabernacle\'s innermost room had this name.', 'What is the Most Holy Place?'],
        ['This annual day focused on atonement for Israel.', 'What is the Day of Atonement?'],
        ['These songs form the Bible’s hymnbook.', 'What are Psalms?'],
        ['Jesus shared bread and cup during this meal.', 'What is Passover?'],
        ['The curtain of the temple tore at this moment.', 'What is Jesus’ death?'],
      ],
      [
        ['This book begins, "The fear of the Lord is the beginning of knowledge."', 'What is Proverbs?'],
        ['Ecclesiastes says there is a time for this many things under heaven.', 'What is everything?'],
        ['Job’s friends sat silently with him for this many days.', 'What is seven?'],
        ['Proverbs compares a timely word to apples of gold in settings of this.', 'What is silver?'],
        ['This king is traditionally linked with many proverbs.', 'Who is Solomon?'],
      ],
      [
        ['John received Revelation on this island.', 'What is Patmos?'],
        ['Revelation names this many churches in Asia.', 'What is seven?'],
        ['The New Jerusalem has this many gates.', 'What is twelve?'],
        ['This repeated word praises the Lord God Almighty.', 'What is holy?'],
        ['Revelation ends with this invitation: “Come, Lord...”', 'Who is Jesus?'],
      ],
    ],
    [[0, 3], [5, 4]],
  ),
  lastTrumpet: {
    category: 'Great Commission',
    clue: 'Jesus sent his disciples to make disciples of all nations in this closing chapter of Matthew.',
    answer: 'What is Matthew 28?',
  },
};
