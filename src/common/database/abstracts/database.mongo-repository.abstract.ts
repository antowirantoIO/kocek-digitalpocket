import { Model, PipelineStage, PopulateOptions, Types } from 'mongoose';
import {
    IDatabaseCreateOptions,
    IDatabaseExistOptions,
    IDatabaseFindAllAggregateOptions,
    IDatabaseFindAllOptions,
    IDatabaseFindOneAggregateOptions,
    IDatabaseFindOneOptions,
    IDatabaseGetTotalAggregateOptions,
    IDatabaseOptions,
} from 'src/common/database/interfaces/database.interface';
import { IDatabaseRepositoryAbstract } from 'src/common/database/interfaces/database.repository.interface';

export abstract class DatabaseMongoRepositoryAbstract<T>
    implements IDatabaseRepositoryAbstract<T>
{
    protected _repository: Model<T>;
    protected _populateOnFind?: PopulateOptions | PopulateOptions[];

    constructor(
        repository: Model<T>,
        populateOnFind?: PopulateOptions | PopulateOptions[]
    ) {
        this._repository = repository;
        this._populateOnFind = populateOnFind;
    }

    async findAll<Y = T>(
        find?: Record<string, any>,
        options?: IDatabaseFindAllOptions
    ): Promise<Y[]> {
        const findAll = this._repository.find(find);

        if (options && options.select) {
            findAll.select(options.select);
        }

        if (
            options &&
            options.limit !== undefined &&
            options.skip !== undefined
        ) {
            findAll.limit(options.limit).skip(options.skip);
        }

        if (options && options.sort) {
            findAll.sort(options.sort);
        }

        if (options && options.populate) {
            if (Array.isArray(this._populateOnFind)) {
                for (const populate of this._populateOnFind) {
                    findAll.populate(populate);
                }
            } else {
                findAll.populate(this._populateOnFind);
            }
        }

        if (options && options.session) {
            findAll.session(options.session);
        }

        return findAll.lean();
    }

    async findAllAggregate<N>(
        pipeline: PipelineStage[],
        options?: IDatabaseFindAllAggregateOptions
    ): Promise<N[]> {
        if (
            options &&
            options.limit !== undefined &&
            options.skip !== undefined
        ) {
            pipeline.push({
                $skip: options.skip,
            });

            pipeline.push({
                $limit: options.limit,
            });
        }

        if (options && options.sort) {
            pipeline.push({
                $sort: options.sort,
            });
        }

        const aggregate = this._repository.aggregate<N>(pipeline);

        if (options && options.session) {
            aggregate.session(options.session);
        }

        return aggregate;
    }

    async findOne<Y = T>(
        find: Record<string, any>,
        options?: IDatabaseFindOneOptions
    ): Promise<Y> {
        const findOne = this._repository.findOne(find);

        if (options && options.select) {
            findOne.select(options.select);
        }

        if (options && options.populate) {
            if (Array.isArray(this._populateOnFind)) {
                for (const populate of this._populateOnFind) {
                    findOne.populate(populate);
                }
            } else {
                findOne.populate(this._populateOnFind);
            }
        }

        if (options && options.session) {
            findOne.session(options.session);
        }

        return findOne.lean();
    }

    async findOneById<Y = T>(
        _id: string,
        options?: IDatabaseFindOneOptions
    ): Promise<Y> {
        const findOne = this._repository.findById(_id);

        if (options && options.select) {
            findOne.select(options.select);
        }

        if (options && options.populate) {
            if (Array.isArray(this._populateOnFind)) {
                for (const populate of this._populateOnFind) {
                    findOne.populate(populate);
                }
            } else {
                findOne.populate(this._populateOnFind);
            }
        }

        if (options && options.session) {
            findOne.session(options.session);
        }

        return findOne.lean();
    }

    async findOneAggregate<Y = T>(
        pipeline: PipelineStage[],
        options?: IDatabaseFindOneAggregateOptions
    ): Promise<Y> {
        pipeline.push({
            $limit: 1,
        });

        const aggregate = this._repository.aggregate<Y>(pipeline);

        if (options && options.session) {
            aggregate.session(options.session);
        }

        const findOne = await aggregate;
        return findOne && findOne.length > 0 ? findOne[0] : undefined;
    }

    async getTotal(
        find?: Record<string, any>,
        options?: IDatabaseOptions
    ): Promise<number> {
        const count = this._repository.countDocuments(find);

        if (options && options.session) {
            count.session(options.session);
        }

        return count;
    }
    async getTotalAggregate(
        pipeline: PipelineStage[],
        options?: IDatabaseGetTotalAggregateOptions
    ): Promise<number> {
        pipeline.push({
            $group: {
                _id: null,
                count: { $sum: options && options.field ? options.field : 1 },
            },
        });

        const aggregate = this._repository.aggregate(pipeline);

        if (options && options.session) {
            aggregate.session(options.session);
        }

        const count = await aggregate;
        return count && count.length > 0 ? count[0].count : 0;
    }

    async exists(
        find: Record<string, any>,
        options?: IDatabaseExistOptions
    ): Promise<boolean> {
        const exist = this._repository.exists({
            ...find,
            _id: {
                $nin: new Types.ObjectId(
                    options && options.excludeId ? options.excludeId : undefined
                ),
            },
        });

        if (options && options.session) {
            exist.session(options.session);
        }

        const result = await exist;

        return result ? true : false;
    }

    async aggregate<N>(
        pipeline: Record<string, any>[],
        options?: IDatabaseOptions
    ): Promise<N[]> {
        const aggregate = this._repository.aggregate<N>(
            pipeline as PipelineStage[]
        );

        if (options && options.session) {
            aggregate.session(options.session);
        }

        return aggregate;
    }

    async create<N>(data: N, options?: IDatabaseCreateOptions): Promise<T> {
        const dataCreate: Record<string, any> = data;
        if (options && options._id) {
            dataCreate._id = new Types.ObjectId(options._id);
        }

        const create = await this._repository.create([dataCreate], {
            session: options ? options.session : undefined,
        });

        return create[0];
    }

    async updateOneById<N>(
        _id: string,
        data: N,
        options?: IDatabaseOptions
    ): Promise<T> {
        return this._repository
            .findByIdAndUpdate(
                _id,
                {
                    $set: data,
                },
                { new: true }
            )
            .session(options ? options.session : undefined);
    }

    async updateOne<N>(
        find: Record<string, any>,
        data: N,
        options?: IDatabaseOptions
    ): Promise<T> {
        return this._repository
            .findByIdAndUpdate(
                find,
                {
                    $set: data,
                },
                { new: true }
            )
            .session(options ? options.session : undefined);
    }

    async deleteOne(
        find: Record<string, any>,
        options?: IDatabaseOptions
    ): Promise<T> {
        return this._repository
            .findOneAndDelete(find, { new: true })
            .session(options ? options.session : undefined);
    }

    async deleteOneById(_id: string, options?: IDatabaseOptions): Promise<T> {
        return this._repository
            .findByIdAndDelete(_id, { new: true })
            .session(options ? options.session : undefined);
    }
}
